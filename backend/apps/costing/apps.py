from django.apps import AppConfig


class CostingConfig(AppConfig):
    name = "apps.costing"

    def ready(self):
        from apps.events.hooks import register
        from . import services

        register("cost", services.cost_handler)
        register("estimate", services.estimate)
