from functools import lru_cache
import json
from django.contrib.gis.db.models import GeometryField
from django.contrib.gis.geos import GEOSGeometry
from django.contrib.postgres.fields import DateTimeRangeField
from psycopg.types.range import Range
from rest_framework import serializers


class GeoJSONField(serializers.Field):
    def to_representation(self, value):
        return json.loads(value.geojson) if value else None

    def to_internal_value(self, value):
        try:
            geom = GEOSGeometry(json.dumps(value), srid=4326)
            if not geom.valid:
                raise ValueError("Invalid geometry")
            return geom
        except Exception as exc:
            raise serializers.ValidationError("Valid WGS84 GeoJSON geometry required.") from exc


class RangeField(serializers.Field):
    def to_representation(self, value):
        return {"start": value.lower.isoformat(), "end": value.upper.isoformat()} if value else None

    def to_internal_value(self, value):
        from apps.events.services import dt

        start, end = dt(value["start"]), dt(value["end"])
        if end <= start:
            raise serializers.ValidationError("End must follow start.")
        return Range(start, end, "[)")


SERVER_FIELDS = {
    "farm",
    "id",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
    "version",
    "on_hand_qty",
    "avg_unit_cost",
    "remaining_qty",
    "meter_hours",
    "head_count",
    "capital_additions_total",
    "geometry",
    "centroid",
    "area_m2",
    "results",
    "is_system",
    "token_hash",
    "pending_deletion_at",
    "legal_hold",
}


class ModelSerializer(serializers.ModelSerializer):
    serializer_field_mapping = {
        **serializers.ModelSerializer.serializer_field_mapping,
        GeometryField: GeoJSONField,
        DateTimeRangeField: RangeField,
    }

    def get_fields(self):
        fields = super().get_fields()
        fields.pop("token_hash", None)
        ctx = self.context.get("ctx")
        for field in fields.values():
            if isinstance(field, serializers.PrimaryKeyRelatedField) and ctx:
                model = field.queryset.model if field.queryset is not None else None
                if model and any(f.name == "farm" for f in model._meta.fields):
                    from django.db.models import Q

                    field.queryset = field.queryset.filter(Q(farm=ctx.farm) | Q(farm__isnull=True))
        return fields

    def to_representation(self, instance):
        value = super().to_representation(instance)
        ctx = self.context.get("ctx")
        if instance._meta.label_lower == "identity.membership":
            value["member_name"] = instance.user.full_name or instance.user.email
            value["member_email"] = instance.user.email
        if instance._meta.label_lower == "identity.invitation":
            value["invitation_code"] = None
            if ctx and "identity.invitation.create" in ctx.permissions and not instance.accepted_at:
                from apps.identity.services import invitation_code
                from django.utils import timezone
                import hashlib, secrets
                token = invitation_code(instance)
                if instance.expires_at > timezone.now() and secrets.compare_digest(instance.token_hash, hashlib.sha256(token.encode()).hexdigest()):
                    value["invitation_code"] = token
        if ctx and not ctx.system:
            financial = (
                "cost",
                "price",
                "rate",
                "amount",
                "balance",
                "revenue",
                "margin",
                "value",
                "principal",
                "interest",
                "salary",
                "wage",
                "rent",
                "salvage",
                "book",
            )
            if "costing.cost.view" not in ctx.permissions:
                for key in list(value):
                    if (
                        any(word in key for word in financial) and key not in ("area_value", "metric_value")
                    ) or key in (
                        "params",
                        "components",
                        "breakdown",
                        "inputs",
                        "results",
                        "attributes",
                        "payload",
                        "before",
                        "after",
                    ):
                        value.pop(key, None)
            if (
                "ledger.entry.view" not in ctx.permissions
                and instance._meta.label_lower == "assets.PersonDetail"
            ):
                for key in ("wage_basis", "is_paid"):
                    value.pop(key, None)
        return value


@lru_cache(maxsize=None)
def serializer_for(model):
    readonly = list(SERVER_FIELDS)
    if model._meta.label_lower in ("assets.asset", "land.cropcycle", "workbench.scenario"):
        readonly += ["status"]
    return type(
        model.__name__ + "Serializer",
        (ModelSerializer,),
        {
            "Meta": type(
                "Meta",
                (),
                {"model": model, "fields": "__all__", "read_only_fields": readonly, "validators": []},
            )
        },
    )
