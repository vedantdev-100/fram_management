import secrets
from django.utils.crypto import salted_hmac
import hashlib
from datetime import timedelta
from django.utils import timezone
from django.db import transaction, IntegrityError
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
    data = dict(data)
    data["email"] = data["email"].strip().lower()
    password = data.pop("password")
    user = User(**data)
    validate_password(password, user)
    user.set_password(password)
    user.full_clean()
    try:
        user.save()
    except IntegrityError as exc:
        raise ValidationError({"email": "An account with this email already exists. Sign in and accept the invitation instead."}) from exc
    return user


def invitation_code(row):
    return salted_hmac("farm-invitation-v2", str(row.pk), algorithm="sha256").hexdigest()


@command("identity.invitation.create")
def invite(ctx, email, role_id):
    role = Role.objects.get(pk=role_id, farm=ctx.farm)
    if role.code == "owner":
        ctx.require("identity.farm.manage")
    if not set(RolePermission.objects.filter(role=role).values_list("permission__code", flat=True)).issubset(ctx.permissions):
        raise ValidationError("You cannot invite someone with permissions you do not hold.")
    row = Invitation(
        farm=ctx.farm, email=email.strip().lower(), role=role,
        expires_at=timezone.now() + timedelta(days=7), invited_by=ctx.user,
    )
    token = invitation_code(row)
    row.token_hash = hashlib.sha256(token.encode()).hexdigest()
    row.save()
    return row, token


@transaction.atomic
def register_with_invitation(data, token):
    # Account creation and membership acceptance are one transaction.
    user = register(data)
    invitation = accept_invitation(user, token)
    return user, invitation


@transaction.atomic
def accept_invitation(user, token):
    token = str(token).strip()
    if not token or len(token) > 512:
        raise ValidationError({"invitation_code": "Invalid, expired or already-used invitation."})
    row = (
        Invitation.objects.select_for_update(of=("self",))
        .filter(
            token_hash=hashlib.sha256(token.encode()).hexdigest(),
            accepted_at=None,
            expires_at__gt=timezone.now(),
        )
        .first()
    )
    if not row or row.email.strip().lower() != user.email.strip().lower():
        raise ValidationError({"invitation_code": "Invalid, expired or already-used invitation for this email."})
    # Serialize joins into a farm, including two invites for the same user.
    farm = Farm.objects.select_for_update().get(pk=row.farm_id)
    if not farm.is_active or farm.pending_deletion_at:
        raise ValidationError({"invitation_code": "This farm is not available for joining."})
    role = Role.objects.select_for_update().filter(pk=row.role_id, farm=farm).first()
    if role is None:
        raise ValidationError({"invitation_code": "This invitation has no valid farm role."})
    member = Membership.objects.select_for_update().filter(farm=farm, user=user).first()
    if member and member.status == "suspended":
        raise ValidationError("Your membership is suspended. Ask a farm administrator to restore access.")
    if member and member.status == "active" and member.role_id != role.pk:
        raise ValidationError("You already belong to this farm with another role. An administrator must change your role separately.")
    if member is None:
        Membership.objects.create(farm=farm, user=user, role=role, status="active", joined_at=timezone.now())
    elif member.status != "active":
        member.role = role
        member.status = "active"
        member.joined_at = timezone.now()
        member.save(update_fields=["role", "status", "joined_at"])
    row.accepted_at = timezone.now()
    row.save(update_fields=["accepted_at"])
    return row


@command("identity.member.manage")
def change_member(ctx, member_id, role_id=None, status=None):
    Farm.objects.select_for_update().get(pk=ctx.farm.pk)
    member = Membership.objects.select_for_update().get(id=member_id, farm=ctx.farm)
    if status not in (None, "active", "suspended", "invited"):
        raise ValidationError("Invalid membership status.")
    role = Role.objects.get(id=role_id, farm=ctx.farm) if role_id else member.role
    if member.role.code == "owner" or role.code == "owner":
        ctx.require("identity.farm.manage")
    if not set(RolePermission.objects.filter(role=role).values_list("permission__code", flat=True)).issubset(ctx.permissions):
        raise ValidationError("You cannot assign permissions you do not hold.")
    if member.status == "active" and member.role.code == "owner" and (role.code != "owner" or status in ("suspended", "invited")):
        if Membership.objects.filter(farm=ctx.farm, role__code="owner", status="active").count() <= 1:
            raise ValidationError("The final active owner cannot be removed.")
    member.role = role
    if status:
        member.status = status
    return save_row(member)


@command("identity.member.manage")
def remove_member(ctx, member_id):
    # Suspend rather than delete: references and work history remain intact.
    return change_member(ctx, member_id, status="suspended")
