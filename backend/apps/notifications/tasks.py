from celery import shared_task
from django.utils import timezone
from .models import Notification


def alert(farm, kind, title, target, key):
    from apps.identity.models import Membership

    for member in Membership.objects.filter(farm=farm, status="active"):
        Notification.objects.get_or_create(
            farm=farm,
            recipient=member.user,
            dedupe_key=key,
            defaults={"kind": kind, "title": title, "related_id": target, "status": "pending"},
        )


@shared_task
def hourly():
    from apps.events.models import Event

    for e in Event.objects.filter(status__in=["planned", "in_progress"], planned_end__lt=timezone.now()):
        alert(
            e.farm,
            "awaiting_confirmation",
            "Event awaiting confirmation: " + e.title,
            e.pk,
            "overdue:" + str(e.pk),
        )
    return {"checked_at": timezone.now().isoformat()}
