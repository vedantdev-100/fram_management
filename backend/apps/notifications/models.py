from django.contrib.gis.db import models
from django.db.models import Q
from apps.core.models import Scoped


class Notification(Scoped):
    recipient = models.ForeignKey("identity.User", on_delete=models.PROTECT, related_name="+")
    kind = models.TextField(blank=True, default="")
    title = models.TextField(blank=True, default="")
    body = models.TextField(blank=True, default="")
    related_type = models.TextField(blank=True, default="")
    related_id = models.UUIDField(null=True, blank=True)
    due_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=40,
        choices=[("pending", "pending"), ("sent", "sent"), ("dismissed", "dismissed")],
        default="pending",
    )
    channel = models.CharField(
        max_length=40, choices=[("in_app", "in app"), ("email", "email")], default="in_app"
    )
    dedupe_key = models.TextField(blank=True, default="")

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(status__in=["pending", "sent", "dismissed"]),
                name="notifications_notification_status_valid",
            ),
            models.CheckConstraint(
                condition=Q(channel__in=["in_app", "email"]), name="notifications_notification_channel_valid"
            ),
            models.UniqueConstraint(
                fields=["farm", "recipient", "dedupe_key"],
                name="notifications_notification_u2",
                nulls_distinct=False,
            ),
        ]


class ReminderRule(Scoped):
    kind = models.TextField(blank=True, default="")
    lead_time = models.PositiveIntegerField(default=0)
    channel = models.CharField(
        max_length=40, choices=[("in_app", "in app"), ("email", "email")], default="in_app"
    )
    is_active = models.BooleanField(default=True)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(channel__in=["in_app", "email"]), name="notifications_reminderrule_channel_valid"
            ),
            models.UniqueConstraint(
                fields=["farm", "kind", "channel"], name="notifications_reminderrule_u1", nulls_distinct=False
            ),
        ]
