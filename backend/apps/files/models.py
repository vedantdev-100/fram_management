from django.contrib.gis.db import models
from django.db.models import Q
from apps.core.models import Scoped


class Attachment(Scoped):
    file = models.FileField(upload_to="attachments/%Y/%m/")
    original_name = models.TextField(blank=True, default="")
    content_type = models.TextField(blank=True, default="")
    size = models.PositiveIntegerField(default=0)
    kind = models.CharField(
        max_length=40,
        choices=[("photo", "photo"), ("bill", "bill"), ("certificate", "certificate"), ("other", "other")],
        default="photo",
    )
    uploaded_by = models.ForeignKey("identity.User", on_delete=models.PROTECT, related_name="+")
    taken_at = models.DateTimeField(null=True, blank=True)
    geotag = models.PointField(srid=4326, null=True, blank=True)
    target_type = models.TextField(blank=True, default="")
    target_id = models.UUIDField()

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(kind__in=["photo", "bill", "certificate", "other"]),
                name="files_attachment_kind_valid",
            )
        ]
