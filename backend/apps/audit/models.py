from django.contrib.gis.db import models
from django.db.models import Q
from apps.core.models import Base, Immutable


class AuditLog(Immutable):
    user = models.ForeignKey(
        "identity.User", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    command_name = models.TextField(blank=True, default="")
    target_type = models.TextField(blank=True, default="")
    target_id = models.UUIDField(null=True, blank=True)
    payload = models.JSONField(default=dict, blank=True)
    result = models.CharField(
        max_length=40, choices=[("success", "success"), ("rejected", "rejected")], default="success"
    )
    ip_address = models.TextField(blank=True, default="")
    user_agent = models.TextField(blank=True, default="")

    class Meta(Immutable.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(result__in=["success", "rejected"]), name="audit_auditlog_result_valid"
            )
        ]


class PurgeReceipt(Base):
    deleted_farm_id = models.UUIDField()
    counts = models.JSONField(default=dict, blank=True)
    completed_at = models.DateTimeField()


class ConfigurationHistory(Immutable):
    target_type = models.TextField(blank=True, default="")
    target_id = models.UUIDField()
    before = models.JSONField(default=dict, blank=True)
    after = models.JSONField(default=dict, blank=True)
