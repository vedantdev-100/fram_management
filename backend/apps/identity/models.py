from django.db.models.functions import Lower
from django.contrib.gis.db import models
from django.db.models import Q
from apps.core.models import Base, Scoped, Shared
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .managers import UserManager


class Farm(Base):
    name = models.TextField(blank=True, default="")
    slug = models.TextField(blank=True, default="")
    country = models.TextField(blank=True, default="")
    region = models.TextField(blank=True, default="")
    timezone = models.TextField(blank=True, default="Asia/Kolkata")
    currency_code = models.TextField(blank=True, default="INR")
    default_area_unit = models.TextField(blank=True, default="m2")
    default_valuation_method = models.CharField(
        max_length=40,
        choices=[("weighted_average", "weighted average"), ("FIFO", "FIFO")],
        default="weighted_average",
    )
    imputed_labour_rate = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    shared_cost_split = models.CharField(
        max_length=40,
        choices=[("by_area", "by area"), ("equal", "equal"), ("by_product_cost", "by product cost")],
        default="by_area",
    )
    require_supervisor_confirmation = models.BooleanField(default=True)
    fiscal_year_start_month = models.PositiveIntegerField(default=4)
    is_active = models.BooleanField(default=True)
    pending_deletion_at = models.DateTimeField(null=True, blank=True)
    legal_hold = models.BooleanField(default=False)

    class Meta(Base.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(default_valuation_method__in=["weighted_average", "FIFO"]),
                name="identity_farm_default_valuation_method_valid",
            ),
            models.CheckConstraint(
                condition=Q(shared_cost_split__in=["by_area", "equal", "by_product_cost"]),
                name="identity_farm_shared_cost_split_valid",
            ),
            models.UniqueConstraint(fields=["slug"], name="identity_farm_slug"),
        ]


class PermissionCode(Base):
    code = models.TextField(blank=True, default="")
    module = models.TextField(blank=True, default="")
    description = models.TextField(blank=True, default="")

    class Meta(Base.Meta):
        abstract = False
        constraints = [models.UniqueConstraint(fields=["code"], name="identity_permissioncode_code")]


class Role(Shared):
    code = models.TextField(blank=True, default="")
    name = models.TextField(blank=True, default="")
    description = models.TextField(blank=True, default="")
    is_system = models.BooleanField(default=False)

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.UniqueConstraint(fields=["farm", "code"], name="identity_role_u0", nulls_distinct=False)
        ]


class RolePermission(Scoped):
    role = models.ForeignKey("identity.Role", on_delete=models.PROTECT, related_name="+")
    permission = models.ForeignKey("identity.PermissionCode", on_delete=models.PROTECT, related_name="+")

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "role", "permission"], name="identity_rolepermission_u0", nulls_distinct=False
            )
        ]


class Membership(Scoped):
    user = models.ForeignKey("identity.User", on_delete=models.PROTECT, related_name="+")
    role = models.ForeignKey("identity.Role", on_delete=models.PROTECT, related_name="+")
    status = models.CharField(
        max_length=40,
        choices=[("invited", "invited"), ("active", "active"), ("suspended", "suspended")],
        default="invited",
    )
    joined_at = models.DateTimeField(null=True, blank=True)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(status__in=["invited", "active", "suspended"]),
                name="identity_membership_status_valid",
            ),
            models.UniqueConstraint(
                fields=["farm", "user"], name="identity_membership_u1", nulls_distinct=False
            ),
        ]


class Invitation(Scoped):
    email = models.TextField(blank=True, default="")
    role = models.ForeignKey("identity.Role", on_delete=models.PROTECT, related_name="+")
    token_hash = models.TextField(blank=True, default="")
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    invited_by = models.ForeignKey("identity.User", on_delete=models.PROTECT, related_name="+")


class User(AbstractBaseUser, PermissionsMixin, Base):
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, unique=True, null=True, blank=True)
    full_name = models.CharField(max_length=200)
    preferred_language = models.CharField(max_length=12, default="en")
    timezone = models.CharField(max_length=80, default="Asia/Kolkata")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]
    objects = UserManager()


User._meta.constraints += [models.UniqueConstraint(Lower("email"), name="user_email_case_insensitive")]
User._meta.original_attrs["constraints"] = User._meta.constraints
