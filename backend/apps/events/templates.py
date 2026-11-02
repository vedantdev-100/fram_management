from rest_framework.exceptions import ValidationError
from apps.core.commands import command, save_row
from apps.events.services import own
from apps.catalogue.models import Unit, PurposeTag, ProductCategory
from apps.assets.models import Asset
from .models import EventCategory, EventType, EventTypeVersion, EventTypeLine


@command("events.type.manage")
def save_type(ctx, data, type_id=None):
    data = dict(data)
    lines = data.pop("lines", [])
    if type_id:
        typ = EventType.objects.select_for_update().get(pk=type_id, farm=ctx.farm)
        previous = EventTypeLine.objects.filter(
            event_type_version__event_type=typ,
            event_type_version__version_no=typ.current_version_no,
            is_locked=True,
        )
        supplied = {int(x["line_no"]): x for x in lines}
        for old in previous:
            line = supplied.get(old.line_no)
            if not line or not line.get("is_locked") or line.get("sub_event_kind") != old.sub_event_kind:
                raise ValidationError("Locked lines must be preserved in new versions.")
        typ.current_version_no += 1
        EventTypeVersion.objects.filter(event_type=typ).update(is_current=False)
    else:
        typ = EventType(farm=ctx.farm)
    for k in (
        "code",
        "name",
        "target_kind",
        "allows_multiple_targets",
        "default_duration_minutes",
        "min_interval_days",
        "max_repeats_per_cycle",
    ):
        if k in data:
            setattr(typ, k, data[k])
    if "category" in data:
        typ.category = own(ctx, EventCategory, data["category"], True)
    save_row(typ)
    version = EventTypeVersion.objects.create(
        farm=ctx.farm, event_type=typ, version_no=typ.current_version_no
    )
    for i, line in enumerate(lines):
        row = EventTypeLine(
            farm=ctx.farm,
            event_type_version=version,
            line_no=line.get("line_no", i + 1),
            sub_event_kind=line["sub_event_kind"],
            asset_class=line.get("asset_class", ""),
            quantity_basis=line.get("quantity_basis", "fixed"),
            default_qty=line.get("default_qty", 0),
            is_required=line.get("is_required", True),
            is_locked=line.get("is_locked", False),
        )
        for name, model in [
            ("qty_unit", Unit),
            ("default_asset", Asset),
            ("purpose_tag", PurposeTag),
            ("product_category", ProductCategory),
        ]:
            if line.get(name):
                setattr(row, name, own(ctx, model, line[name], name != "default_asset"))
        if row.sub_event_kind not in typ.category.allowed_sub_event_kinds:
            raise ValidationError("Kind not allowed by category.")
        save_row(row)
    return typ
