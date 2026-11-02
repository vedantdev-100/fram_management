from rest_framework.exceptions import APIException


class DomainError(APIException):
    status_code = 400
    default_code = "invalid_command"


class Conflict(DomainError):
    status_code = 409
    default_code = "conflict"
