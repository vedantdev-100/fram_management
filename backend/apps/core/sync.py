from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from django.core import signing
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.apps import apps
from apps.identity.access import Context, scoped_queryset
from .resources import RESOURCES, PREFIX
from .serializers import serializer_for


class SyncView(APIView):
    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request, farm_id):
        ctx = Context.resolve(request.user, farm_id)
        cursor = request.query_params.get("cursor")
        since = None
        if cursor:
            try:
                decoded = signing.loads(cursor, salt="farm-sync", max_age=86400 * 30)
                if decoded["farm"] != str(farm_id) or decoded["user"] != str(request.user.pk):
                    raise ValueError()
                since = parse_datetime(decoded["at"])
            except Exception:
                raise ValidationError("Invalid or expired sync cursor; perform a fresh sync.")
        until = timezone.now()
        data = {}
        count = 0
        for resource in [
            "blocks",
            "crop-cycles",
            "assets",
            "events",
            "sub-events",
            "targets",
            "observations",
            "suggestions",
            "stock-items",
        ]:
            model = apps.get_model(RESOURCES[resource])
            if PREFIX[model._meta.app_label] + ".view" not in ctx.permissions:
                continue
            q = scoped_queryset(ctx, model).filter(updated_at__lte=until)
            if since:
                q = q.filter(updated_at__gt=since)
            rows = list(q[:1001])
            if len(rows) > 1000:
                raise ValidationError(
                    "Sync window too large. Use paginated resource endpoints for large farms."
                )
            data[resource] = serializer_for(model)(rows, many=True, context={"ctx": ctx}).data
            count += len(rows)
        token = signing.dumps(
            {"farm": str(farm_id), "user": str(request.user.pk), "at": until.isoformat()}, salt="farm-sync"
        )
        return Response({"cursor": token, "changes": data, "count": count})

    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request, farm_id):
        ctx = Context.resolve(request.user, farm_id)
        from apps.events.services import create_event

        items = request.data.get("events", [])
        if len(items) > 50:
            raise ValidationError("Maximum 50 events per batch.")
        results = []
        from rest_framework.exceptions import APIException

        for item in items:
            try:
                event = create_event(ctx, item)
                results.append(
                    {"client_uuid": str(event.client_uuid), "id": str(event.pk), "status": "accepted"}
                )
            except APIException as exc:
                results.append(
                    {"client_uuid": item.get("client_uuid"), "status": "rejected", "error": str(exc.detail)}
                )
        return Response({"results": results})
