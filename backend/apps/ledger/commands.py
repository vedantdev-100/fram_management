import calendar
from decimal import Decimal
from datetime import date, timedelta
from rest_framework.exceptions import ValidationError
from apps.core.commands import command
from apps.events.services import create_event, _confirm
from apps.events.models import EventType
from apps.assets.models import Asset
from apps.catalogue.models import Unit
from .models import LedgerAccount, LedgerCategory, Loan, LoanScheduleRow

D = Decimal


def financial_event(ctx, data):
    # Ledger permissions may create payment-only events without granting operational planning.
    original = ctx.permissions
    ctx.permissions = set(original) | {"events.event.plan"}
    try:
        event = create_event(ctx, data)
    finally:
        ctx.permissions = original
    if event.status == "done":
        return event
    event.status = "in_progress"
    event.save()
    return _confirm(ctx, event, {}, None)


@command("ledger.entry.create")
def transfer(ctx, source_id, destination_id, amount, client_uuid, at):
    source = LedgerAccount.objects.select_for_update().get(pk=source_id, farm=ctx.farm)
    target = LedgerAccount.objects.select_for_update().get(pk=destination_id, farm=ctx.farm)
    if source.pk == target.pk or D(str(amount)) <= 0:
        raise ValidationError("Two different accounts and a positive amount are required.")
    asset, _ = Asset.objects.get_or_create(
        farm=ctx.farm, code="SYSTEM-CASH", defaults={"name": "Cash movements", "asset_class": "flow"}
    )
    unit = Unit.objects.get(farm=None, code="piece")
    category = LedgerCategory.objects.get(farm=None, code="transfer")
    typ = EventType.objects.get(farm=None, code="lease_tenure")
    lines = [
        {
            "kind": kind,
            "asset": str(asset.pk),
            "qty_unit": str(unit.pk),
            "planned_qty": "1",
            "amount": str(amount),
            "account_id": str(account.pk),
            "ledger_category_id": str(category.pk),
        }
        for kind, account in [("pay", source), ("receive", target)]
    ]
    from apps.events.services import dt

    start = dt(at)
    return financial_event(
        ctx,
        {
            "client_uuid": client_uuid,
            "event_type": str(typ.pk),
            "planned_start": start.isoformat(),
            "planned_end": (start + timedelta(seconds=1)).isoformat(),
            "lines": lines,
        },
    )


@command("ledger.entry.create")
def record_payment(ctx, data):
    allowed = {"pay", "receive"}
    if any(line.get("kind") not in allowed for line in data.get("lines", [])):
        raise ValidationError("Ledger command accepts payment/receipt lines only.")
    return financial_event(ctx, data)


@command("ledger.entry.manage")
def generate_loan_schedule(ctx, loan_id):
    loan = Loan.objects.select_for_update().get(pk=loan_id, farm=ctx.farm)
    if LoanScheduleRow.objects.filter(loan=loan).exists():
        return loan
    n = loan.term_months
    if n <= 0 or loan.principal <= 0:
        raise ValidationError("Positive term and principal required.")
    monthly = loan.interest_rate / 1200
    remaining = loan.principal
    payment = (loan.principal * monthly / (1 - (1 + monthly) ** (-n))) if monthly else loan.principal / n
    for i in range(1, n + 1):
        month = loan.start_date.month - 1 + i
        year = loan.start_date.year + month // 12
        month = month % 12 + 1
        due = date(year, month, min(loan.start_date.day, calendar.monthrange(year, month)[1]))
        interest = (loan.principal if loan.rate_basis == "flat" else remaining) * monthly
        principal = loan.principal / n if loan.rate_basis == "flat" else payment - interest
        principal = remaining if i == n else principal.quantize(D(".01"))
        remaining -= principal
        LoanScheduleRow.objects.create(
            farm=ctx.farm,
            loan=loan,
            due_date=due,
            principal_due=principal,
            interest_due=interest.quantize(D(".01")),
        )
    return loan
