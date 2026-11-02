import hashlib
import json
from functools import wraps
from django.db import transaction
from apps.core.errors import Conflict


def digest(value):
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, default=str, separators=(",", ":")).encode()
    ).hexdigest()


def command(permission):
    def decorate(fn):
        @wraps(fn)
        def run(ctx, *args, **kwargs):
            from apps.audit.models import AuditLog

            try:
                with transaction.atomic():
                    ctx.require(permission)
                    result = fn(ctx, *args, **kwargs)
                    AuditLog.objects.create(
                        farm=ctx.farm,
                        user=ctx.user,
                        command_name=fn.__name__,
                        target_type=getattr(getattr(result, "_meta", None), "label_lower", ""),
                        target_id=getattr(result, "pk", None),
                        payload={},
                        result="success",
                    )
                    return result
            except Exception:
                # Outside the failed transaction so a rejected command remains visible.
                if not transaction.get_connection().needs_rollback:
                    AuditLog.objects.create(
                        farm=ctx.farm, user=ctx.user, command_name=fn.__name__, payload={}, result="rejected"
                    )
                raise

        return run

    return decorate


def check_version(obj, version):
    if version is None or int(version) != obj.version:
        raise Conflict("Supply the current version; this record changed or version is missing.")


def save_row(obj):
    obj.full_clean()
    obj.save()
    return obj
