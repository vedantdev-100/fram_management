import uuid
from django.contrib.gis.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class FarmQuerySet(models.QuerySet):
    def for_farm(self, farm):
        return self.filter(farm_id=getattr(farm, "pk", farm))


class Base(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )
    version = models.PositiveIntegerField(default=1)

    class Meta:
        abstract = True
        ordering = ["-created_at", "id"]


class Scoped(Base):
    farm = models.ForeignKey("identity.Farm", on_delete=models.PROTECT, related_name="+")
    objects = FarmQuerySet.as_manager()

    class Meta(Base.Meta):
        abstract = True

    def clean(self):
        super().clean()
        for f in self._meta.fields:
            if not f.is_relation or f.name in ("farm", "created_by", "updated_by"):
                continue
            value = getattr(self, f.attname, None)
            if value is None:
                continue
            obj = getattr(self, f.name)
            if hasattr(obj, "farm_id") and obj.farm_id not in (None, self.farm_id):
                raise ValidationError({f.name: "Related record belongs to another farm."})


class Shared(Scoped):
    farm = models.ForeignKey(
        "identity.Farm", null=True, blank=True, on_delete=models.PROTECT, related_name="+"
    )

    class Meta(Scoped.Meta):
        abstract = True


class Immutable(Scoped):
    class Meta(Scoped.Meta):
        abstract = True

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise ValidationError("Immutable record: use a reversal.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Immutable record: use a reversal.")


class CommandReceipt(Scoped):
    client_uuid = models.UUIDField()
    command_name = models.TextField(blank=True, default="")
    request_hash = models.TextField(blank=True, default="")
    result = models.JSONField(default=dict, blank=True)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "client_uuid", "command_name"],
                name="core_commandreceipt_u0",
                nulls_distinct=False,
            )
        ]
