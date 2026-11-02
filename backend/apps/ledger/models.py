from django.contrib.gis.db import models
from django.db.models import Q
from apps.core.models import Scoped, Shared, Immutable


class LedgerAccount(Scoped):
    kind = models.CharField(
        max_length=40,
        choices=[
            ("cash", "cash"),
            ("bank", "bank"),
            ("mobile_wallet", "mobile wallet"),
            ("loan_payable", "loan payable"),
            ("supplier_credit_payable", "supplier credit payable"),
            ("buyer_credit_receivable", "buyer credit receivable"),
            ("advance", "advance"),
        ],
        default="cash",
    )
    name = models.TextField(blank=True, default="")
    counterparty = models.ForeignKey(
        "catalogue.Counterparty", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    opening_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    opening_date = models.DateField()
    is_active = models.BooleanField(default=True)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(
                    kind__in=[
                        "cash",
                        "bank",
                        "mobile_wallet",
                        "loan_payable",
                        "supplier_credit_payable",
                        "buyer_credit_receivable",
                        "advance",
                    ]
                ),
                name="ledger_ledgeraccount_kind_valid",
            )
        ]


class LedgerCategory(Shared):
    code = models.TextField(blank=True, default="")
    name = models.TextField(blank=True, default="")
    kind = models.CharField(
        max_length=40,
        choices=[
            ("asset_purchase", "asset purchase"),
            ("operating_payment", "operating payment"),
            ("loan_principal", "loan principal"),
            ("interest", "interest"),
            ("sales_receipt", "sales receipt"),
            ("subsidy", "subsidy"),
            ("other_income", "other income"),
            ("transfer", "transfer"),
        ],
        default="asset_purchase",
    )
    parent = models.ForeignKey(
        "ledger.LedgerCategory", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(
                    kind__in=[
                        "asset_purchase",
                        "operating_payment",
                        "loan_principal",
                        "interest",
                        "sales_receipt",
                        "subsidy",
                        "other_income",
                        "transfer",
                    ]
                ),
                name="ledger_ledgercategory_kind_valid",
            ),
            models.UniqueConstraint(
                fields=["farm", "code"], name="ledger_ledgercategory_u1", nulls_distinct=False
            ),
        ]


class LedgerEntry(Immutable):
    account = models.ForeignKey("ledger.LedgerAccount", on_delete=models.PROTECT, related_name="+")
    entry_date = models.DateField()
    direction = models.CharField(max_length=40, choices=[("in", "in"), ("out", "out")], default="in")
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    category = models.ForeignKey("ledger.LedgerCategory", on_delete=models.PROTECT, related_name="+")
    counterparty = models.ForeignKey(
        "catalogue.Counterparty", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    sub_event = models.ForeignKey(
        "events.SubEvent", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    event = models.ForeignKey("events.Event", on_delete=models.PROTECT, related_name="+")
    reference_no = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=40, choices=[("pending", "pending"), ("cleared", "cleared")], default="pending"
    )
    due_date = models.DateField(null=True, blank=True)
    memo = models.TextField(blank=True, default="")
    transfer_group = models.UUIDField(null=True, blank=True)
    client_uuid = models.UUIDField()
    reversal_of = models.ForeignKey(
        "ledger.LedgerEntry", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )

    class Meta(Immutable.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(direction__in=["in", "out"]), name="ledger_ledgerentry_direction_valid"
            ),
            models.CheckConstraint(
                condition=Q(status__in=["pending", "cleared"]), name="ledger_ledgerentry_status_valid"
            ),
            models.UniqueConstraint(
                fields=["farm", "client_uuid"], name="ledger_ledgerentry_u2", nulls_distinct=False
            ),
        ]


class Loan(Scoped):
    lender = models.ForeignKey("catalogue.Counterparty", on_delete=models.PROTECT, related_name="+")
    account = models.ForeignKey("ledger.LedgerAccount", on_delete=models.PROTECT, related_name="+")
    principal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    interest_rate = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    rate_basis = models.CharField(
        max_length=40, choices=[("flat", "flat"), ("reducing", "reducing")], default="flat"
    )
    start_date = models.DateField()
    term_months = models.PositiveIntegerField(default=0)
    purpose = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=40, choices=[("active", "active"), ("closed", "closed")], default="active"
    )

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(rate_basis__in=["flat", "reducing"]), name="ledger_loan_rate_basis_valid"
            ),
            models.CheckConstraint(
                condition=Q(status__in=["active", "closed"]), name="ledger_loan_status_valid"
            ),
        ]


class LoanScheduleRow(Scoped):
    loan = models.ForeignKey("ledger.Loan", on_delete=models.PROTECT, related_name="+")
    due_date = models.DateField()
    principal_due = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    interest_due = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(
        max_length=40, choices=[("due", "due"), ("paid", "paid"), ("overdue", "overdue")], default="due"
    )
    ledger_entry = models.ForeignKey(
        "ledger.LedgerEntry", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(status__in=["due", "paid", "overdue"]), name="ledger_loanschedulerow_status_valid"
            )
        ]


LedgerEntry._meta.constraints += [
    models.CheckConstraint(condition=Q(amount__gt=0), name="ledger_amount_positive")
]
