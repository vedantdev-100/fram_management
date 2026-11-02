from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
import csv
import io
import json
from datetime import date
from django.apps import apps
from django.db import connection
from django.http import HttpResponse, FileResponse
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, MethodNotAllowed, NotFound
from apps.identity.access import Context, scoped_queryset
from .resources import RESOURCES, EDITABLE, PREFIX
from .serializers import serializer_for, SERVER_FIELDS
from .configuration import config_write


class ResourceViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "post", "patch", "head", "options"]
    resource = ""

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        self.ctx = Context.resolve(request.user, kwargs["farm_id"])
        self.ctx.require(
            PREFIX[self.model._meta.app_label] + ".view"
            if request.method in ("GET", "HEAD", "OPTIONS")
            else PREFIX[self.model._meta.app_label] + (".create" if self.action == "create" else ".update")
        )

    def get_serializer_class(self):
        return serializer_for(self.model)

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "ctx": getattr(self, "ctx", None)}

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return self.model.objects.none()
        q = scoped_queryset(self.ctx, self.model)
        if self.resource == "notifications":
            q = q.filter(recipient=self.request.user)
        if self.resource == "attachments":
            ids = []
            for row in q:
                try:
                    target = apps.get_model(row.target_type).objects.get(pk=row.target_id, farm=self.ctx.farm)
                    self.ctx.object(target)
                    self.ctx.require(PREFIX[target._meta.app_label] + ".view")
                except Exception:
                    continue
                ids.append(row.pk)
            q = q.filter(pk__in=ids)
        fields = {f.name for f in self.model._meta.fields}
        for key in ("status", "crop_cycle", "event", "asset", "stock_item", "block", "season"):
            if key in fields and self.request.query_params.get(key):
                q = q.filter(**{key: self.request.query_params[key]})
        if self.resource == "blocks":
            from django.contrib.gis.geos import Polygon, Point

            bbox = self.request.query_params.get("bbox")
            if bbox:
                try:
                    q = q.filter(geometry__intersects=Polygon.from_bbox(tuple(map(float, bbox.split(",")))))
                except Exception:
                    raise ValidationError("bbox must be west,south,east,north.")
            point = self.request.query_params.get("contains_point")
            if point:
                try:
                    q = q.filter(geometry__covers=Point(*map(float, point.split(",")), srid=4326))
                except Exception:
                    raise ValidationError("contains_point must be longitude,latitude.")
        return q

    def ensure_editable(self):
        if self.resource not in EDITABLE:
            raise MethodNotAllowed(
                self.request.method, detail="Use the documented command endpoint for this resource."
            )
        forbidden = set(self.request.data) & SERVER_FIELDS - {"version"}
        if forbidden:
            raise ValidationError({"read_only_fields": sorted(forbidden)})

    def create(self, request, *args, **kwargs):
        self.ensure_editable()
        return super().create(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self.ensure_editable()
        return super().partial_update(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.instance = config_write(self.ctx, self.model, serializer.validated_data)

    def perform_update(self, serializer):
        if serializer.instance.farm_id is None:
            raise ValidationError("System rows must be copied to your farm before editing.")
        serializer.instance = config_write(
            self.ctx,
            self.model,
            serializer.validated_data,
            serializer.instance,
            self.request.data.get("version"),
        )


def resource_view(name, label):
    return type(
        label.split(".")[-1] + "ViewSet",
        (ResourceViewSet,),
        {
            "resource": name,
            "model": apps.get_model(label),
            "http_method_names": ["get", "post", "patch", "head", "options"]
            if name in EDITABLE
            else ["get", "head", "options"],
        },
    )


def represent(result, ctx):
    if isinstance(result, tuple):
        return [represent(x, ctx) for x in result]
    if hasattr(result, "_meta"):
        return serializer_for(type(result))(result, context={"ctx": ctx}).data
    return result


class CommandView(APIView):
    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request, farm_id, command):
        ctx = Context.resolve(request.user, farm_id)
        d = dict(request.data)
        from apps.events import services as events
        from apps.land import services as land
        from apps.cropscience import services as science
        from apps.costing import services as costing
        from apps.workbench import services as workbench
        from apps.identity import services as identity
        from apps.events.templates import save_type
        from apps.events.amendments import amend_event

        from apps.ledger import commands as ledger_commands
        from apps.core import extra_commands as extra

        calls = {
            "ledger_transfer": lambda: ledger_commands.transfer(
                ctx, d["source_id"], d["destination_id"], d["amount"], d["client_uuid"], d["at"]
            ),
            "record_payment": lambda: ledger_commands.record_payment(ctx, d),
            "generate_loan_schedule": lambda: ledger_commands.generate_loan_schedule(ctx, d["loan_id"]),
            "set_role_permissions": lambda: extra.set_role_permissions(ctx, d["role_id"], d["codes"]),
            "create_role": lambda: extra.create_role(ctx, d["code"], d["name"]),
            "update_farm": lambda: extra.update_farm(ctx, d["farm"], d["version"]),
            "create_category": lambda: extra.create_category(ctx, d),
            "duplicate_event": lambda: extra.duplicate_event(
                ctx,
                d["event_id"],
                d["client_uuid"],
                d["planned_start"],
                d["planned_end"],
                d.get("draft", False),
            ),
            "set_execution": lambda: extra.set_execution(ctx, d["event_id"], d["execution"], d["version"]),
            "archive_scenario": lambda: extra.archive_scenario(ctx, d["scenario_id"]),
            "duplicate_configuration": lambda: extra.duplicate_configuration(
                ctx, d["resource"], d["id"], d.get("changes", {})
            ),
            "create_event": lambda: events.create_event(ctx, d),
            "plan_event": lambda: events.plan_event(ctx, d["event_id"], d["version"]),
            "start_event": lambda: events.start_event(ctx, d["event_id"], d["version"]),
            "cancel_event": lambda: events.cancel_event(ctx, d["event_id"], d["version"]),
            "reschedule_event": lambda: events.reschedule_event(
                ctx, d["event_id"], d["start"], d["end"], d["version"]
            ),
            "submit_event": lambda: events.submit_event(
                ctx, d["event_id"], d.get("corrections", {}), d["version"]
            ),
            "confirm_event": lambda: events.confirm_event(
                ctx, d["event_id"], d.get("corrections", {}), d.get("version"), d.get("override_reason")
            ),
            "amend_event": lambda: amend_event(
                ctx, d["event_id"], d["version"], d["reason"], d["replacement"]
            ),
            "record_observation": lambda: events.record_observation(ctx, d),
            "adjust_stock": lambda: events.adjust_stock(ctx, d),
            "save_type": lambda: save_type(ctx, d["type"], d.get("type_id")),
            "create_crop_cycle": lambda: land.create_crop_cycle(ctx, d["cycle"], d["blocks"]),
            "attach_blocks": lambda: land.attach_blocks(ctx, d["cycle_id"], d["blocks"]),
            "close_cycle": lambda: land.close_cycle(ctx, d["cycle_id"], d["version"]),
            "set_boundary": lambda: land.set_boundary(
                ctx, d["block_id"], d["geometry"], d["version"], d.get("source", "drawn"), d.get("note", "")
            ),
            "split_block": lambda: land.split_block(ctx, d["block_id"], d["children"], d["version"]),
            "preview_boundary": lambda: self.preview(ctx, d),
            "generate_calendar": lambda: science.generate_calendar(ctx, d["cycle_id"], d["template_id"]),
            "record_stage": lambda: science.record_stage(
                ctx, d["cycle_id"], d["stage_id"], date.fromisoformat(d["observed_on"]), d["event_id"]
            ),
            "recompute_gdd": lambda: science.recompute_gdd(ctx, d["cycle_id"]),
            "decide_suggestion": lambda: science.decide_suggestion(
                ctx, d["suggestion_id"], d["accept"], d.get("event")
            ),
            "change_depreciation_policy": lambda: costing.change_depreciation_policy(
                ctx,
                d["asset_id"],
                d["policy_id"],
                date.fromisoformat(d["effective_date"]),
                d.get("reason", ""),
                d.get("remaining_life_hours"),
                d.get("remaining_life_years"),
                d.get("preview", False),
            ),
            "run_reconciliation": lambda: costing.run_reconciliation(
                ctx, date.fromisoformat(d["start"]), date.fromisoformat(d["end"])
            ),
            "compute_metrics": lambda: workbench.compute_metrics(ctx, d["scenario_id"]),
            "adopt_scenario": lambda: workbench.adopt_scenario(ctx, d["scenario_id"]),
            "invite": lambda: identity.invite(ctx, d["email"], d["role_id"]),
            "change_member": lambda: identity.change_member(
                ctx, d["member_id"], d.get("role_id"), d.get("status")
            ),
            "mark_notification_read": lambda: self.mark_read(ctx, d),
        }
        if command not in calls:
            raise NotFound("Unknown command.")
        try:
            result = calls[command]()
        except KeyError as exc:
            raise ValidationError({"missing_field": str(exc)})
        except (ValueError, TypeError) as exc:
            raise ValidationError(str(exc))
        return Response(represent(result, ctx))

    def preview(self, ctx, data):
        ctx.require("land.block.edit_boundary")
        from apps.land.services import geometry, area

        g = geometry(data["geometry"], repair=True)
        return {"geometry": json.loads(g.geojson), "area_m2": str(area(g)), "requires_confirmation": True}

    def mark_read(self, ctx, data):
        from apps.notifications.models import Notification

        row = Notification.objects.get(pk=data["notification_id"], farm=ctx.farm, recipient=ctx.user)
        row.read_at = timezone.now()
        row.save()
        return row


class ReportView(APIView):
    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request, farm_id, name):
        ctx = Context.resolve(request.user, farm_id)
        from apps.reporting.services import report

        rows = report(ctx, name)
        if request.query_params.get("format") == "csv":
            ctx.require("reporting.report.export")
            buf = io.StringIO()
            if rows:
                writer = csv.DictWriter(buf, fieldnames=rows[0].keys())
                writer.writeheader()
                # Formula injection protection for downloaded spreadsheet-compatible CSV.
                for row in rows:
                    writer.writerow(
                        {
                            k: ("'" + v if isinstance(v, str) and v.startswith(("=", "+", "-", "@")) else v)
                            for k, v in row.items()
                        }
                    )
            response = HttpResponse(buf.getvalue(), content_type="text/csv")
            response["Content-Disposition"] = f'attachment; filename="{name}.csv"'
            return response
        return Response(rows)


class HealthView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        return Response({"status": "ok"})


class ReadinessView(HealthView):
    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        from django.conf import settings
        import redis

        try:
            with connection.cursor() as c:
                c.execute("SELECT PostGIS_Version()")
                c.fetchone()
            redis.Redis.from_url(settings.REDIS_URL, socket_connect_timeout=2).ping()
        except Exception:
            return Response({"status": "unavailable"}, status=503)
        return Response({"status": "ready"})


class AttachmentUploadView(APIView):
    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request, farm_id):
        ctx = Context.resolve(request.user, farm_id)
        ctx.require("files.attachment.create")
        from apps.files.models import Attachment

        target_type = request.data["target_type"]
        if target_type not in RESOURCES.values():
            raise ValidationError("Unsupported attachment target.")
        target = apps.get_model(target_type).objects.get(pk=request.data["target_id"], farm=ctx.farm)
        ctx.object(target, "record")
        ctx.require(PREFIX[target._meta.app_label] + ".view")
        f = request.FILES.get("file")
        if not f or f.size > 10 * 1024 * 1024:
            raise ValidationError("File required; maximum 10 MB.")
        allowed = {
            "image/jpeg": b"\xff\xd8\xff",
            "image/png": b"\x89PNG\r\n\x1a\n",
            "application/pdf": b"%PDF-",
        }
        head = f.read(16)
        f.seek(0)
        if f.content_type not in allowed or not head.startswith(allowed[f.content_type]):
            raise ValidationError("Only valid JPEG, PNG and PDF files are accepted.")
        row = Attachment.objects.create(
            farm=ctx.farm,
            file=f,
            original_name=f.name,
            content_type=f.content_type,
            size=f.size,
            uploaded_by=ctx.user,
            target_type=target_type,
            target_id=target.pk,
            kind=request.data.get("kind", "other"),
        )
        return Response({"id": str(row.pk)}, status=201)


class AttachmentDownloadView(APIView):
    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request, farm_id, pk):
        ctx = Context.resolve(request.user, farm_id)
        ctx.require("files.attachment.view")
        from apps.files.models import Attachment

        row = Attachment.objects.get(pk=pk, farm=ctx.farm)
        target = apps.get_model(row.target_type).objects.get(pk=row.target_id, farm=ctx.farm)
        ctx.object(target)
        ctx.require(PREFIX[target._meta.app_label] + ".view")
        return FileResponse(row.file.open("rb"), as_attachment=True, filename=row.original_name)


class BoundaryImportView(APIView):
    @extend_schema(request=OpenApiTypes.OBJECT, responses=OpenApiTypes.OBJECT)
    def post(self, request, farm_id):
        ctx = Context.resolve(request.user, farm_id)
        ctx.require("land.block.edit_boundary")
        from apps.land.imports import preview_upload

        if "file" not in request.FILES:
            raise ValidationError("Upload file is required.")
        return Response(preview_upload(request.FILES["file"]))


class BoundaryExportView(APIView):
    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request, farm_id):
        ctx = Context.resolve(request.user, farm_id)
        ctx.require("land.land.view")
        ctx.require("reporting.report.export")
        from apps.land.models import Block

        features = [
            {
                "type": "Feature",
                "id": str(b.pk),
                "geometry": json.loads(b.geometry.geojson),
                "properties": {"code": b.code, "name": b.name, "area_m2": str(b.area_m2)},
            }
            for b in scoped_queryset(ctx, Block).exclude(geometry=None)
        ]
        return Response({"type": "FeatureCollection", "features": features})
