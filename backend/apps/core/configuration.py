from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.core.serializers.json import DjangoJSONEncoder
import json
from rest_framework.exceptions import ValidationError
from apps.core.commands import command, save_row, check_version
from apps.audit.models import ConfigurationHistory


@command("identity.member.update")
def unused_identity_guard(ctx):
    raise ValidationError("Use membership command.")


def validate_config(ctx, obj):
    label = obj._meta.label_lower
    ctx.object(obj, "manage") if obj.pk and not obj._state.adding else None
    if label == "catalogue.unit" and obj.to_base_factor <= 0:
        raise ValidationError("Conversion factor must be positive.")
    if label == "catalogue.productcroplabel":
        if obj.dose_min < 0 or obj.dose_max < obj.dose_min or obj.per_area_unit.dimension != "area":
            raise ValidationError("Invalid label range or area unit.")
    if label == "land.block":
        if obj.area_unit.dimension != "area" or obj.area_value <= 0:
            raise ValidationError("Positive block area and area unit required.")
        obj.area_m2 = (obj.area_value * obj.area_unit.to_base_factor).quantize(
            Decimal("0.0001"), rounding=ROUND_HALF_UP
        )
        # Child areas are created atomically by split; direct creation cannot leave parent totals inconsistent.
        if obj.parent_id:
            raise ValidationError("Create child blocks with split_block.")
    if label == "land.blockaccess":
        ctx.require("identity.member.manage")
        ctx.blocks([obj.block_id], "manage")
    if label == "land.season" and obj.end_date < obj.start_date:
        raise ValidationError("End date precedes start.")
    if label == "assets.persondetail" and obj.user_id:
        from apps.identity.models import Membership

        if not Membership.objects.filter(farm=ctx.farm, user=obj.user, status="active").exists():
            raise ValidationError("Linked person must be an active farm member.")
    if label == "assets.tenure" and obj.end_date and obj.end_date < obj.start_date:
        raise ValidationError("Tenure end precedes start.")
    if label == "assets.asset" and obj.home_location_id and obj.home_location.asset_class != "space":
        raise ValidationError("Home location must be a space asset.")
    if label == "assets.stockitem":
        if obj.asset.asset_class != "stock":
            raise ValidationError("Stock detail needs a stock asset.")
        if obj.base_unit.to_base_factor != 1:
            raise ValidationError("Stock base_unit must be canonical (factor 1).")
        if obj.product_id and obj.product.default_unit.dimension != obj.base_unit.dimension:
            raise ValidationError("Product unit dimension differs.")
    expected = {
        "assets.machinedetail": "machine",
        "assets.persondetail": "person",
        "assets.spacedetail": "space",
        "assets.livingdetail": "living",
        "assets.flowdetail": "flow",
    }
    if label in expected and obj.asset.asset_class != expected[label]:
        raise ValidationError("Detail does not match asset class.")
    if label == "scheduling.availabilitywindow" and obj.recurrence_rule:
        raise ValidationError("Expand recurrence into explicit availability windows before saving.")
    if label == "costing.costrule":
        if not isinstance(obj.params, dict) or "rate" not in obj.params:
            raise ValidationError("Cost rule params must contain rate.")
        if Decimal(str(obj.params["rate"])) < 0:
            raise ValidationError("Negative cost rate.")
    if label == "workbench.scenariocropcycle" and obj.crop_cycle.status != "draft":
        raise ValidationError("Scenario links require draft crop cycles.")
    if label == "workbench.investmentanalysis":
        from apps.workbench.services import investment

        obj.results = investment(obj.inputs)
    if label == "cropscience.weatherdaily" and obj.tmin_c > obj.tmax_c:
        raise ValidationError("Minimum exceeds maximum temperature.")
    if label == "cropscience.cropstage" and obj.end_threshold < obj.start_threshold:
        raise ValidationError("Stage threshold range invalid.")


def config_write(ctx, model, data, instance=None, version=None):
    from .resources import PREFIX
    from apps.audit.models import AuditLog

    code = PREFIX[model._meta.app_label] + (".update" if instance else ".create")
    ctx.require(code)
    with transaction.atomic():
        before = {}
        if instance:
            instance = model.objects.select_for_update().get(pk=instance.pk, farm=ctx.farm)
            check_version(instance, version)
            before = json.loads(
                json.dumps(
                    {f.name: getattr(instance, f.attname) for f in model._meta.fields if not f.is_relation},
                    cls=DjangoJSONEncoder,
                    default=str,
                )
            )
            # Versioned pricing and templates are copied, never rewritten after use.
            if model._meta.label_lower in ("costing.costrule", "costing.depreciationpolicy"):
                raise ValidationError("Create a new version row; existing rules/policies are immutable.")
        obj = instance or model(farm=ctx.farm, created_by=ctx.user)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.updated_by = ctx.user
        if instance:
            obj.version += 1
        validate_config(ctx, obj)
        save_row(obj)
        after = json.loads(json.dumps({f.name: str(getattr(obj, f.attname)) for f in obj._meta.fields}))
        ConfigurationHistory.objects.create(
            farm=ctx.farm,
            target_type=obj._meta.label_lower,
            target_id=obj.pk,
            before=before,
            after=after,
            created_by=ctx.user,
        )
        AuditLog.objects.create(
            farm=ctx.farm,
            user=ctx.user,
            command_name="config_write",
            target_type=obj._meta.label_lower,
            target_id=obj.pk,
            result="success",
        )
        return obj
