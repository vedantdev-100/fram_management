from decimal import Decimal
from rest_framework.exceptions import ValidationError
from apps.events.services import own
from .models import LedgerAccount, LedgerCategory, LedgerEntry


def ledger_handler(ctx, e, lines):
    for s in lines:
        if s.kind not in ("pay", "receive"):
            continue
        ctx.require("ledger.entry.create")
        if not s.account_id or not s.ledger_category_id:
            raise ValidationError("Payment needs account_id and ledger_category_id.")
        account = own(ctx, LedgerAccount, s.account_id)
        category = own(ctx, LedgerCategory, s.ledger_category_id, True)
        if s.amount <= 0:
            raise ValidationError("Payment amount must be positive.")
        LedgerEntry.objects.create(
            farm=ctx.farm,
            account=account,
            entry_date=s.actual_end.date(),
            direction="out" if s.kind == "pay" else "in",
            amount=s.amount,
            category=category,
            counterparty=s.counterparty,
            sub_event=s,
            event=e,
            status="cleared",
            memo=s.notes,
            transfer_group=e.client_uuid if category.kind == "transfer" else None,
            client_uuid=s.client_uuid,
        )

        if s.capitalize_to_asset_id:
            from apps.costing.models import AssetCapitalProfile, PrepaidEntry

            target = s.capitalize_to_asset
            if target.asset_class == "space" and not s.capital_terms:
                PrepaidEntry.objects.create(
                    farm=ctx.farm, asset=target, sub_event=s, amount=s.amount, entry_date=s.actual_end.date()
                )
            else:
                p = (
                    AssetCapitalProfile.objects.select_for_update()
                    .filter(asset=target, farm=ctx.farm)
                    .first()
                )
                if p:
                    p.capital_additions_total += s.amount
                    p.save()
                else:
                    terms = s.capital_terms
                    if not terms or not (
                        terms.get("expected_life_hours") or terms.get("expected_life_years")
                    ):
                        raise ValidationError(
                            "Initial capital acquisition requires capital_terms with expected life."
                        )
                    salvage = Decimal(str(terms.get("salvage_value", 0)))
                    if salvage < 0 or salvage > s.amount:
                        raise ValidationError("Salvage value must be between zero and acquisition cost.")
                    AssetCapitalProfile.objects.create(
                        farm=ctx.farm,
                        asset=target,
                        in_service_date=s.actual_end.date(),
                        acquisition_cost=s.amount,
                        salvage_value=salvage,
                        expected_life_hours=terms.get("expected_life_hours", 0),
                        expected_life_years=terms.get("expected_life_years", 0),
                    )


def balance(account):
    entries = LedgerEntry.objects.filter(account=account)
    return account.opening_balance + sum(
        (x.amount if x.direction == "in" else -x.amount for x in entries), Decimal(0)
    )
