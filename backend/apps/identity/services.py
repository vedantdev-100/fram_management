import secrets
import hashlib
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import ValidationError
from apps.core.commands import command, save_row
from .models import User, Farm, Role, PermissionCode, RolePermission, Membership, Invitation

MODULES = "identity catalogue land assets scheduling events cropscience ledger costing compliance workbench files notifications audit reporting".split()
RESOURCES = {
    "identity": ["farm", "member", "role", "invitation"],
    "catalogue": ["catalogue"],
    "land": ["land", "block", "cycle"],
    "assets": ["asset"],
    "scheduling": ["schedule"],
    "events": ["event", "observation", "type", "stock"],
    "cropscience": ["science"],
    "ledger": ["entry"],
    "costing": ["cost", "depreciation"],
    "compliance": ["compliance"],
    "workbench": ["scenario"],
    "files": ["attachment"],
    "notifications": ["notification"],
    "audit": ["log"],
    "reporting": ["report"],
}
ACTIONS = "view create update plan start submit confirm cancel reschedule amend adjust manage export override edit_boundary adopt compute close".split()


def permission_codes():
    return [f"{m}.{r}.{a}" for m, resources in RESOURCES.items() for r in resources for a in ACTIONS]


def role_codes(role):
    allcodes = set(permission_codes())
    if role == "owner":
        return allcodes
    if role == "manager":
        return {c for c in allcodes if not c.startswith("identity.farm.") or c.endswith(".view")}
    views = {c for c in allcodes if c.endswith(".view")}
    public_views = {c for c in views if not c.startswith(("ledger.", "costing.", "audit.", "identity."))}
    if role == "viewer":
        return public_views
    if role == "accountant":
        return {c for c in allcodes if c.startswith(("ledger.", "costing.", "reporting."))} | {
            c for c in views if c.startswith(("land.", "assets.", "workbench."))
        }
    if role == "advisor":
        return (
            public_views
            | {"costing.cost.view"}
            | {c for c in allcodes if c.startswith("cropscience.")}
            | {"events.observation.create"}
        )
    if role == "supervisor":
        return (
            public_views
            | {"costing.cost.view"}
            | {f"events.event.{a}" for a in ["plan", "start", "submit", "confirm", "cancel", "reschedule"]}
            | {"events.observation.create", "events.stock.adjust"}
        )
    return {
        c
        for c in public_views
        if c.startswith(("land.", "events.", "catalogue.", "assets.", "files.", "notifications."))
    } | {"events.event.start", "events.event.submit", "events.observation.create", "files.attachment.create"}


def seed_permissions():
    for code in permission_codes():
        PermissionCode.objects.get_or_create(code=code, defaults={"module": code.split(".")[0]})


@transaction.atomic
def create_farm(user, data):
    farm = save_row(Farm(created_by=user, **data))
    seed_permissions()
    for code in ["owner", "manager", "supervisor", "worker", "accountant", "advisor", "viewer"]:
        role = Role.objects.create(farm=farm, code=code, name=code.title())
        for perm in PermissionCode.objects.filter(code__in=role_codes(code)):
            RolePermission.objects.create(farm=farm, role=role, permission=perm)
        if code == "owner":
            Membership.objects.create(
                farm=farm, user=user, role=role, status="active", joined_at=timezone.now()
            )
    from apps.audit.models import AuditLog

    AuditLog.objects.create(
        farm=farm, user=user, command_name="create_farm", target_id=farm.pk, result="success"
    )
    return farm


@transaction.atomic
def register(data):
    data["email"] = data["email"].lower()
    password = data.pop("password")
    user = User(**data)
    validate_password(password, user)
    user.set_password(password)
    user.full_clean()
    user.save()
    return user


@command("identity.invitation.create")
def invite(ctx, email, role_id):
    role = Role.objects.get(pk=role_id, farm=ctx.farm)
    if role.code == "owner":
        ctx.require("identity.farm.manage")
    token = secrets.token_urlsafe(32)
    row = Invitation.objects.create(
        farm=ctx.farm,
        email=email.lower(),
        role=role,
        token_hash=hashlib.sha256(token.encode()).hexdigest(),
        expires_at=timezone.now() + timedelta(days=7),
        invited_by=ctx.user,
    )
    return row, token


@transaction.atomic
def accept_invitation(user, token):
    row = (
        Invitation.objects.select_for_update()
        .filter(
            token_hash=hashlib.sha256(token.encode()).hexdigest(),
            accepted_at=None,
            expires_at__gt=timezone.now(),
        )
        .first()
    )
    if not row or row.email.lower() != user.email.lower():
        raise ValidationError("Invalid invitation.")
    Membership.objects.update_or_create(
        farm=row.farm, user=user, defaults={"role": row.role, "status": "active", "joined_at": timezone.now()}
    )
    row.accepted_at = timezone.now()
    row.save()
    return row


@command("identity.member.manage")
def change_member(ctx, member_id, role_id=None, status=None):
    member = Membership.objects.select_for_update().get(id=member_id, farm=ctx.farm)
    role = Role.objects.get(id=role_id, farm=ctx.farm) if role_id else member.role
    if member.role.code == "owner" or role.code == "owner":
        ctx.require("identity.farm.manage")
    if member.role.code == "owner" and (role.code != "owner" or status == "suspended"):
        if Membership.objects.filter(farm=ctx.farm, role__code="owner", status="active").count() <= 1:
            raise ValidationError("The final active owner cannot be removed.")
    member.role = role
    if status:
        member.status = status
    return save_row(member)
