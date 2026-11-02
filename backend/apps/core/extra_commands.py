from django.apps import apps
from django.db.models import Q
from rest_framework.exceptions import ValidationError
from apps.core.commands import command, check_version, save_row
from apps.core.errors import Conflict
from apps.core.resources import RESOURCES, EDITABLE, PREFIX
from apps.identity.models import Role, RolePermission, PermissionCode, Farm
from apps.events.models import Event, SubEvent, EventTarget, EventExecution, EventCategory
from apps.events.services import create_event, own


@command("identity.role.manage")
def set_role_permissions(ctx, role_id, codes):
    role = Role.objects.select_for_update().get(pk=role_id, farm=ctx.farm)
    if role.code == "owner":
        raise ValidationError("Owner permissions are fixed to prevent lockout.")
    requested = set(codes)
    if not requested.issubset(ctx.permissions):
        raise ValidationError("Cannot grant permissions you do not hold.")
    if role.code != "owner" and any(
        c.startswith("identity.farm.") and not c.endswith(".view") for c in requested
    ):
        ctx.require("identity.farm.manage")
    perms = list(PermissionCode.objects.filter(code__in=requested))
    if len(perms) != len(requested):
        raise ValidationError("Unknown permission code.")
    RolePermission.objects.filter(farm=ctx.farm, role=role).delete()
    for perm in perms:
        RolePermission.objects.create(farm=ctx.farm, role=role, permission=perm)
    return role


@command("identity.role.manage")
def create_role(ctx, code, name):
    if code in ("owner", "manager", "worker", "supervisor", "viewer", "advisor", "accountant"):
        raise ValidationError("System role code already reserved.")
    return save_row(Role(farm=ctx.farm, code=code, name=name))


@command("identity.farm.update")
def update_farm(ctx, data, version):
    row = Farm.objects.select_for_update().get(pk=ctx.farm.pk)
    check_version(row, version)
    allowed = {
        "name",
        "country",
        "region",
        "timezone",
        "currency_code",
        "default_area_unit",
        "default_valuation_method",
        "imputed_labour_rate",
        "shared_cost_split",
        "require_supervisor_confirmation",
        "fiscal_year_start_month",
    }
    if set(data) - allowed:
        raise ValidationError("Unknown or protected farm fields.")
    if "currency_code" in data and data["currency_code"] != row.currency_code:
        from apps.ledger.models import LedgerEntry

        if LedgerEntry.objects.filter(farm=row).exists():
            raise Conflict("Currency cannot change after financial transactions.")
    if "timezone" in data:
        from zoneinfo import ZoneInfo

        ZoneInfo(data["timezone"])
    if "fiscal_year_start_month" in data and not 1 <= int(data["fiscal_year_start_month"]) <= 12:
        raise ValidationError("Fiscal start month must be 1–12.")
    for key, value in data.items():
        setattr(row, key, value)
    row.version += 1
    return save_row(row)


@command("events.type.manage")
def create_category(ctx, data):
    mapped = EventCategory.objects.get(pk=data["maps_to"], farm=None, is_system=True)
    return save_row(
        EventCategory(
            farm=ctx.farm,
            code=data["code"],
            name=data["name"],
            maps_to=mapped,
            allowed_sub_event_kinds=mapped.allowed_sub_event_kinds,
            requires_crop_target=mapped.requires_crop_target,
            requires_safety_record=mapped.requires_safety_record,
            creates_stock=mapped.creates_stock,
            involves_cash=mapped.involves_cash,
            cost_bucket=mapped.cost_bucket,
        )
    )


@command("events.event.plan")
def duplicate_event(ctx, event_id, client_uuid, planned_start, planned_end, draft=False):
    e = Event.objects.get(pk=event_id, farm=ctx.farm)
    ctx.object(e, "record")
    targets = [
        {
            "crop_cycle": str(t.crop_cycle_id) if t.crop_cycle_id else None,
            "block": str(t.block_id) if t.block_id else None,
            "asset": str(t.asset_id) if t.asset_id else None,
            "area_unit": str(t.area_unit_id) if t.area_unit_id else None,
            "area_value": str(t.area_value),
        }
        for t in EventTarget.objects.filter(event=e)
    ]
    lines = []
    for s in SubEvent.objects.filter(event=e):
        line = {
            "line_no": s.line_no,
            "kind": s.kind,
            "asset": str(s.asset_id),
            "planned_qty": str(s.planned_qty),
            "qty_unit": str(s.qty_unit_id),
            "unit_price": str(s.unit_price),
            "amount": str(s.amount),
            "notes": s.notes,
            "capital_terms": s.capital_terms,
        }
        for field in (
            "purpose_tag",
            "counterparty",
            "operator",
            "destination",
            "grade",
            "capitalize_to_asset",
        ):
            value = getattr(s, field + "_id")
            if value:
                line[field] = str(value)
        for field in ("account_id", "ledger_category_id"):
            if getattr(s, field):
                line[field] = str(getattr(s, field))
        lines.append(line)
    return create_event(
        ctx,
        {
            "client_uuid": client_uuid,
            "event_type": str(e.event_type_id),
            "title": e.title,
            "planned_start": planned_start,
            "planned_end": planned_end,
            "draft": draft,
            "targets": targets,
            "lines": lines,
        },
    )


@command("events.event.submit")
def set_execution(ctx, event_id, data, version):
    from apps.events.services import authorize_event
    from apps.assets.models import Asset

    e = Event.objects.select_for_update().get(pk=event_id, farm=ctx.farm)
    authorize_event(ctx, e, "submit")
    check_version(e, version)
    if e.status not in ("planned", "in_progress"):
        raise Conflict("Execution can only be recorded for an open event.")
    allowed = {"operator", "weather_note", "wind_note", "rain_flag", "equipment_note"}
    if set(data) - allowed:
        raise ValidationError("Unknown execution fields.")
    data = dict(data)
    if data.get("operator"):
        data["operator"] = own(ctx, Asset, data["operator"])
        if data["operator"].asset_class != "person":
            raise ValidationError("Operator must be a person asset.")
    row, _ = EventExecution.objects.update_or_create(farm=ctx.farm, event=e, defaults=data)
    e.version += 1
    e.save()
    return row


@command("workbench.scenario.update")
def archive_scenario(ctx, scenario_id):
    from apps.workbench.models import Scenario

    row = Scenario.objects.select_for_update().get(pk=scenario_id, farm=ctx.farm)
    if row.status == "adopted":
        raise Conflict("Adopted scenario history is retained.")
    row.status = "archived"
    row.save()
    return row


def duplicate_configuration(ctx, resource, pk, changes):
    from apps.core.configuration import config_write

    if resource not in EDITABLE:
        raise ValidationError("Resource cannot be copied through this command.")
    model = apps.get_model(RESOURCES[resource])
    ctx.require(PREFIX[model._meta.app_label] + ".create")
    old = model.objects.filter(Q(farm=ctx.farm) | Q(farm__isnull=True)).get(pk=pk)
    excluded = {"id", "farm", "created_at", "updated_at", "created_by", "updated_by", "version", "is_system"}
    data = {f.name: getattr(old, f.name) for f in model._meta.fields if f.name not in excluded}
    allowed = {f.name for f in model._meta.fields} - excluded
    if set(changes) - allowed:
        raise ValidationError("Unknown or protected fields.")
    data.update(changes)
    return config_write(ctx, model, data)
