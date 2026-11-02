from django.apps import AppConfig


class ComplianceConfig(AppConfig):
    name = "apps.compliance"

    def ready(self):
        from apps.events.hooks import register
        from .services import validate, confirmed

        register("validate", validate)
        register("compliance", confirmed)
