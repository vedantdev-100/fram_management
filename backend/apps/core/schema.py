"""OpenAPI mapping for the two custom database field types."""

from drf_spectacular.extensions import OpenApiSerializerFieldExtension


class GeoJSONExtension(OpenApiSerializerFieldExtension):
    target_class = "apps.core.serializers.GeoJSONField"

    def map_serializer_field(self, auto_schema, direction):
        return {
            "type": "object",
            "properties": {"type": {"type": "string"}, "coordinates": {"type": "array", "items": {}}},
        }


class RangeExtension(OpenApiSerializerFieldExtension):
    target_class = "apps.core.serializers.RangeField"

    def map_serializer_field(self, auto_schema, direction):
        return {
            "type": "object",
            "required": ["start", "end"],
            "properties": {
                "start": {"type": "string", "format": "date-time"},
                "end": {"type": "string", "format": "date-time"},
            },
        }
