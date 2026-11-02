from django.apps import AppConfig


class CropscienceConfig(AppConfig):
    name = "apps.cropscience"

    def ready(self):
        from apps.events.hooks import register
        from .services import science_handler

        register("science", science_handler)
