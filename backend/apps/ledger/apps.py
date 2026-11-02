from django.apps import AppConfig


class LedgerConfig(AppConfig):
    name = "apps.ledger"

    def ready(self):
        from apps.events.hooks import register
        from . import services

        register("ledger", services.ledger_handler)
