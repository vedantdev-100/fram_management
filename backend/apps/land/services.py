import json
from decimal import Decimal
from django.contrib.gis.gdal import GDALException
from django.contrib.gis.geos import GEOSGeometry
from django.contrib.gis.geos.error import GEOSException
from django.db import connection
from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from apps.core.commands import command, save_row, check_version
from apps.core.errors import Conflict
from apps.events.services import own, canonical
from apps.catalogue.models import Unit
from .models import Block, BlockBoundaryRevision, CropCycle, CropCycleBlock

D = Decimal


def geometry(value, repair=False):
    try:
        g = GEOSGeometry(json.dumps(value) if isinstance(value, dict) else value)
    except (GDALException, GEOSException, ValueError, TypeError) as exc:
        raise ValidationError("Cannot read the boundary geometry.") from exc
    if g.srid is None:
        g.srid = 4326
    elif g.srid != 4326:
        g.transform(4326)
    if g.empty:
        raise ValidationError("Empty boundary.")
    if g.geom_type not in ("Polygon", "MultiPolygon"):
        raise ValidationError(
            f"A Polygon or MultiPolygon is required; received {g.geom_type}. "
            "Export a polygon boundary, not a point or line."
        )
    xmin, ymin, xmax, ymax = g.extent
    if xmin < -180 or xmax > 180 or ymin < -90 or ymax > 90:
        raise ValidationError("Coordinates must be WGS84 longitude/latitude.")
    if not g.valid:
        if not repair:
            raise ValidationError("Invalid geometry; preview the repaired geometry before saving.")
        g = g.make_valid()
    # Repair may collapse a polygon to lines or produce a GeometryCollection.
    # Do not silently save non-area components as a farm boundary.
    if g.empty or g.geom_type not in ("Polygon", "MultiPolygon") or not g.valid:
        raise ValidationError("Repair did not produce a valid Polygon or MultiPolygon. Redraw the boundary.")
    return g


def area(g):
    with connection.cursor() as c:
        c.execute("SELECT ST_Area(ST_GeomFromEWKT(%s)::geography)", [g.ewkt])
        return D(str(c.fetchone()[0])).quantize(D(".0001"))


def validate_boundary(block, g):
    a = area(g)
    if a <= 0:
        raise ValidationError("Boundary has zero area.")
    if block.parent_id and block.parent.geometry:
        with connection.cursor() as c:
            c.execute(
                "SELECT ST_CoveredBy(ST_GeomFromEWKT(%s),ST_Buffer(ST_GeomFromEWKT(%s)::geography,1)::geometry)",
                [g.ewkt, block.parent.geometry.ewkt],
            )
            if not c.fetchone()[0]:
                raise ValidationError("Child boundary falls outside parent.")
    for sibling in (
        Block.objects.filter(farm=block.farm, parent_id=block.parent_id)
        .exclude(pk=block.pk)
        .exclude(geometry=None)
    ):
        overlap = g.intersection(sibling.geometry)
        if (
            not overlap.empty
            and overlap.geom_type in ("Polygon", "MultiPolygon")
            and area(overlap) > min(a, sibling.area_m2) * D(".01")
        ):
            raise ValidationError("Sibling boundaries overlap beyond one percent.")
    return a


@command("land.block.edit_boundary")
def set_boundary(ctx, block_id, geojson, version, source="drawn", note=""):
    # Lock the farm to serialize sibling geometry changes.
    type(ctx.farm).objects.select_for_update().get(pk=ctx.farm.pk)
    block = Block.objects.select_for_update().get(pk=block_id, farm=ctx.farm)
    ctx.object(block, "manage")
    check_version(block, version)
    g = geometry(geojson)
    a = validate_boundary(block, g)
    children = Block.objects.filter(parent=block)
    child_area = children.aggregate(v=Sum("area_m2"))["v"]
    if child_area is not None and abs(child_area - a) > a * D(".01"):
        raise ValidationError("Parent area must equal children areas within one percent.")
    block.geometry = g
    block.centroid = g.centroid
    block.area_m2 = a
    block.area_value = a / block.area_unit.to_base_factor
    block.area_source = "drawn"
    block.version += 1
    block.save()
    BlockBoundaryRevision.objects.create(
        farm=ctx.farm,
        block=block,
        geometry=g,
        area_m2=a,
        source=source,
        effective_from=timezone.now(),
        note=note,
        created_by=ctx.user,
    )
    return block


@command("land.block.edit_boundary")
def split_block(ctx, block_id, children, version):
    parent = Block.objects.select_for_update().get(pk=block_id, farm=ctx.farm)
    ctx.object(parent, "manage")
    check_version(parent, version)
    if Block.objects.filter(parent=parent).exists():
        raise Conflict("Block already has children.")
    if CropCycleBlock.objects.filter(
        block=parent, crop_cycle__status__in=["planned", "active", "harvesting"]
    ).exists():
        raise Conflict("Close active cycles before splitting.")
    if not parent.geometry:
        raise ValidationError("Draw parent boundary first.")
    created = []
    for data in children:
        child = Block.objects.create(
            farm=ctx.farm, parent=parent, code=data["code"], name=data["name"], area_unit=parent.area_unit
        )
        set_boundary(ctx, child.pk, data["geometry"], child.version)
        child.refresh_from_db()
        created.append(child)
    if abs(sum(b.area_m2 for b in created) - parent.area_m2) > parent.area_m2 * D(".01"):
        raise ValidationError("Children must cover the parent area.")
    return parent


@command("land.cycle.create")
def create_crop_cycle(ctx, data, blocks):
    from apps.catalogue.models import Crop, Variety
    from .models import Season

    type(ctx.farm).objects.select_for_update().get(pk=ctx.farm.pk)
    data = dict(data)
    for field, model in [
        ("season", Season),
        ("crop", Crop),
        ("variety", Variety),
        ("expected_yield_unit", Unit),
    ]:
        if data.get(field):
            data[field] = own(ctx, model, data[field], field != "season")
    data["status"] = "draft" if data.pop("draft", False) else "planned"
    cycle = save_row(CropCycle(farm=ctx.farm, created_by=ctx.user, **data))
    attach_blocks(ctx, cycle.pk, blocks)
    return cycle


@command("land.cycle.update")
def attach_blocks(ctx, cycle_id, blocks):
    cycle = CropCycle.objects.select_for_update().get(pk=cycle_id, farm=ctx.farm)
    if cycle.status not in ("draft", "planned"):
        raise Conflict("Only draft/planned cycle areas may change.")
    if cycle.expected_harvest_end < cycle.planned_sowing_date:
        raise ValidationError("Invalid cycle dates.")
    locks = [x["block"] for x in blocks]
    list(Block.objects.select_for_update().filter(id__in=locks, farm=ctx.farm).order_by("id"))
    for item in blocks:
        b = own(ctx, Block, item["block"])
        ctx.blocks([b.pk], "manage")
        if Block.objects.filter(parent=b).exists():
            raise ValidationError("Only leaf blocks host crops.")
        unit = own(ctx, Unit, item["area_unit"], True)
        a = canonical(item["area_value"], unit, "area")
        g = geometry(item["geometry"]) if item.get("geometry") else None
        if g:
            if not b.geometry or not b.geometry.covers(g):
                raise ValidationError("Cycle geometry lies outside block.")
            a = area(g)
        overlaps = (
            CropCycleBlock.objects.filter(
                block=b,
                crop_cycle__planned_sowing_date__lte=cycle.expected_harvest_end,
                crop_cycle__expected_harvest_end__gte=cycle.planned_sowing_date,
            )
            .exclude(crop_cycle=cycle)
            .exclude(crop_cycle__status__in=["draft", "abandoned", "closed"])
            .exclude(is_intercrop=True)
        )
        occupied = overlaps.aggregate(v=Sum("area_m2"))["v"] or D(0)
        if a <= 0 or a > b.area_m2 or (not item.get("is_intercrop", False) and occupied + a > b.area_m2):
            raise Conflict("Crop area exceeds available block area.")
        CropCycleBlock.objects.update_or_create(
            farm=ctx.farm,
            crop_cycle=cycle,
            block=b,
            defaults={
                "area_value": a / unit.to_base_factor,
                "area_unit": unit,
                "area_m2": a,
                "geometry": g,
                "is_intercrop": item.get("is_intercrop", False),
            },
        )
    return cycle


@command("land.cycle.close")
def close_cycle(ctx, cycle_id, version):
    cycle = CropCycle.objects.select_for_update().get(pk=cycle_id, farm=ctx.farm)
    ctx.object(cycle, "manage")
    check_version(cycle, version)
    from apps.events.models import EventTarget

    if EventTarget.objects.filter(crop_cycle=cycle, event__status__in=["planned", "in_progress"]).exists():
        raise Conflict("Complete or cancel outstanding events first.")
    cycle.status = "closed"
    cycle.actual_harvest_end = timezone.localdate()
    cycle.version += 1
    cycle.save()
    return cycle
