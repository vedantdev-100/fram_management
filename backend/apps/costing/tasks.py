from zoneinfo import ZoneInfo
from datetime import timedelta
from celery import shared_task
from django.utils import timezone
from apps.identity.models import Farm
from apps.identity.access import Context
from .services import run_holding_accrual, run_reconciliation


@shared_task
def daily():
    results = []
    for farm in Farm.objects.filter(is_active=True, pending_deletion_at=None):
        date = timezone.now().astimezone(ZoneInfo(farm.timezone)).date() - timedelta(days=1)
        ctx = Context.for_system(farm)
        run = run_holding_accrual(ctx, date)
        from .models import ReconciliationRun

        if not ReconciliationRun.objects.filter(farm=farm, period_start=date, period_end=date).exists():
            run_reconciliation(ctx, date, date)
        results.append(str(run.pk))
    return results
