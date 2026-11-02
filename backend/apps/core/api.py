from django.core.exceptions import ObjectDoesNotExist, ValidationError as DjangoValidationError
from django.db import IntegrityError
from rest_framework.views import exception_handler as drf_handler
from rest_framework.response import Response
from rest_framework.pagination import CursorPagination as BaseCursor
from rest_framework.exceptions import NotFound, ValidationError


class CursorPagination(BaseCursor):
    ordering = ("-created_at", "id")
    page_size = 50


def exception_handler(exc, context):
    if isinstance(exc, ObjectDoesNotExist):
        exc = NotFound("Record not found.")
    if isinstance(exc, DjangoValidationError):
        exc = ValidationError(getattr(exc, "message_dict", exc.messages))
    if isinstance(exc, IntegrityError):
        return Response(
            {
                "code": "integrity_conflict",
                "message": "The command conflicts with an existing record or constraint.",
                "fields": {},
            },
            status=409,
        )
    response = drf_handler(exc, context)
    if response is not None:
        response.data = {
            "code": getattr(exc, "default_code", "error"),
            "message": str(getattr(exc, "detail", exc)),
            "fields": response.data,
        }
    return response
