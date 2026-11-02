from dataclasses import dataclass
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied, NotFound
from .models import Membership, RolePermission


@dataclass
class Context:
    user: object
    farm: object
    membership: object
    permissions: set
    system: bool = False

    @classmethod
    def resolve(cls, user, farm_id):
        membership = (
            Membership.objects.select_related("farm", "role")
            .filter(farm_id=farm_id, user=user, status="active", farm__is_active=True)
            .first()
        )
        if not membership:
            raise NotFound("Farm not found.")
        if membership.farm.pending_deletion_at:
            raise PermissionDenied("Farm pending deletion; use the owner export/cancel endpoints.")
        permissions = set(
            RolePermission.objects.filter(role=membership.role).values_list("permission__code", flat=True)
        )
        return cls(user, membership.farm, membership, permissions)

    @classmethod
    def for_system(cls, farm):
        # Only background services use this; never constructed from HTTP input.
        return cls(None, farm, None, set(), True)

    def require(self, code):
        if not self.system and code not in self.permissions:
            raise PermissionDenied("Missing permission: " + code)

    def allowed_blocks(self, level="view"):
        from apps.land.models import BlockAccess, Block

        if self.system:
            return None
        scopes = BlockAccess.objects.filter(farm=self.farm, membership=self.membership)
        if not scopes.exists():
            return None
        levels = {"view": ["view", "record", "manage"], "record": ["record", "manage"], "manage": ["manage"]}[
            level
        ]
        ids = set(scopes.filter(access_level__in=levels).values_list("block_id", flat=True))
        frontier = set(ids)
        while frontier:
            frontier = (
                set(Block.objects.filter(farm=self.farm, parent_id__in=frontier).values_list("id", flat=True))
                - ids
            )
            ids.update(frontier)
        return ids

    def blocks(self, ids, level="view"):
        from apps.land.models import Block

        ids = {str(x) for x in ids if x}
        found = {
            str(x) for x in Block.objects.filter(farm=self.farm, id__in=ids).values_list("id", flat=True)
        }
        allowed = self.allowed_blocks(level)
        if found != ids or (allowed is not None and not ids.issubset({str(x) for x in allowed})):
            raise PermissionDenied("Block outside your scope.")

    def object(self, obj, level="view"):
        if hasattr(obj, "farm_id") and obj.farm_id not in (None, self.farm.pk):
            raise NotFound("Record not found.")
        ids = object_blocks(obj)
        self.blocks(ids, level)
        if (
            self.allowed_blocks(level) is not None
            and not ids
            and obj._meta.app_label
            in ("events", "land", "compliance", "costing", "workbench", "ledger", "files")
        ):
            raise PermissionDenied("Unscoped record is not visible to a block-limited membership.")


def object_blocks(obj, seen=None):
    from django.apps import apps

    seen = seen or set()
    key = (obj._meta.label, str(obj.pk))
    if key in seen:
        return set()
    seen.add(key)
    label = obj._meta.label_lower
    if label == "land.block":
        return {obj.pk}
    ids = set()
    if label == "land.cropcycle":
        ids.update(
            apps.get_model("land", "CropCycleBlock")
            .objects.filter(crop_cycle=obj)
            .values_list("block_id", flat=True)
        )
    if label == "events.event":
        for target in apps.get_model("events", "EventTarget").objects.filter(event=obj):
            ids.update(object_blocks(target, seen))
    for name in ("block", "crop_cycle", "event", "sub_event", "source_event", "cost_record", "event_target"):
        if getattr(obj, name + "_id", None):
            ids.update(object_blocks(getattr(obj, name), seen))
    return ids


def scoped_queryset(ctx, model):
    if model._meta.label_lower == "identity.farm":
        return model.objects.filter(pk=ctx.farm.pk)
    q = model.objects.filter(Q(farm=ctx.farm) | Q(farm__isnull=True))
    if ctx.allowed_blocks() is not None and model._meta.app_label in (
        "land",
        "events",
        "compliance",
        "costing",
        "workbench",
        "ledger",
    ):
        ids = []
        for row in q:
            try:
                ctx.object(row)
            except PermissionDenied:
                continue
            ids.append(row.pk)
        q = q.filter(pk__in=ids)
    # Limited workers are identified by capability, not a role name.
    if (
        model._meta.label_lower == "events.event"
        and "events.event.start" in ctx.permissions
        and "events.event.plan" not in ctx.permissions
    ):
        from apps.events.models import SubEvent
        from apps.assets.models import PersonDetail

        people = PersonDetail.objects.filter(farm=ctx.farm, user=ctx.user).values("asset_id")
        q = q.filter(
            pk__in=SubEvent.objects.filter(Q(asset_id__in=people) | Q(operator_id__in=people)).values(
                "event_id"
            )
        )
    return q
