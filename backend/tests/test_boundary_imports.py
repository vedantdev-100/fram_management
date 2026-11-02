import gc
import json
import tempfile
import weakref
from decimal import Decimal
from pathlib import Path
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from rest_framework.exceptions import ValidationError

from apps.land import imports as boundary_imports
from apps.land.services import geometry

POLYGON = {"type": "Polygon", "coordinates": [[[79.370685, 20.732284], [79.370613, 20.730918], [79.370991, 20.730893], [79.371111, 20.732251], [79.370685, 20.732284]]]}
LINE = {"type": "LineString", "coordinates": [[79.370734, 20.73089], [79.370865, 20.732251], [79.37111, 20.732246], [79.371052, 20.731478], [79.370992, 20.730863], [79.370737, 20.730895]]}


def upload(value):
    return SimpleUploadedFile("boundary.geojson", json.dumps(value).encode(), "application/geo+json")


class BoundaryImportTests(SimpleTestCase):
    def preview(self, value):
        # PostGIS area calculation is unchanged; no database needed for these tests.
        with patch.object(boundary_imports, "area", return_value=Decimal("100.0000")):
            return boundary_imports.preview_upload(upload(value))

    def test_supplied_polygon(self):
        result = self.preview({"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": POLYGON, "properties": {}}]})
        self.assertEqual(result["features"][0]["geometry"]["type"], "Polygon")
        self.assertTrue(result["requires_confirmation"])

    def test_supplied_line_is_clear_validation_error(self):
        with self.assertRaises(ValidationError) as caught:
            self.preview({"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": LINE}]})
        self.assertIn("LineString", str(caught.exception.detail))
        self.assertIn("feature", caught.exception.detail)

    def test_explicitly_closed_farm_outline(self):
        ring = LINE["coordinates"] + [LINE["coordinates"][0]]
        self.assertTrue(geometry({"type": "Polygon", "coordinates": [ring]}).valid)

    def test_geojson_uses_no_temporary_file(self):
        with patch.object(boundary_imports.tempfile, "TemporaryDirectory", side_effect=AssertionError("GeoJSON should not need temporary files")):
            self.preview(POLYGON)

    def test_invalid_json(self):
        with self.assertRaises(ValidationError):
            boundary_imports.preview_upload(SimpleUploadedFile("bad.geojson", b"not json"))

    def test_malformed_geometry_is_validation_error(self):
        with self.assertRaises(ValidationError):
            self.preview({"type": "Polygon", "coordinates": "invalid"})

    def test_empty_collection(self):
        with self.assertRaises(ValidationError):
            self.preview({"type": "FeatureCollection", "features": []})

    def test_null_geometry(self):
        with self.assertRaises(ValidationError):
            self.preview({"type": "Feature", "geometry": None})

    def test_feature_limit(self):
        with self.assertRaises(ValidationError):
            self.preview({"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": POLYGON}] * 1001})

    def test_invalid_polygon_requires_preview(self):
        bowtie = "POLYGON((0 0,1 1,1 0,0 1,0 0))"
        with self.assertRaises(ValidationError):
            geometry(bowtie)
        self.assertTrue(geometry(bowtie, repair=True).valid)

    def test_repair_cannot_save_collapsed_line(self):
        with self.assertRaises(ValidationError):
            geometry("POLYGON((0 0,1 0,2 0,0 0))", repair=True)

    def test_gdal_handles_released_before_cleanup_on_success_and_rejection(self):
        original_source = boundary_imports.DataSource
        original_temp = tempfile.TemporaryDirectory
        for value in (POLYGON, LINE):
            references = []
            def open_source(path):
                source = original_source(path)
                references.append(weakref.ref(source))
                return source
            class CheckedDirectory(original_temp):
                def __exit__(self, *args):
                    gc.collect()
                    if any(ref() is not None for ref in references):
                        raise AssertionError("GDAL datasource still alive at directory cleanup")
                    return super().__exit__(*args)
            document = {"type": "Feature", "geometry": value, "crs": {"type": "name", "properties": {"name": "EPSG:4326"}}}
            with patch.object(boundary_imports, "DataSource", side_effect=open_source), patch.object(boundary_imports.tempfile, "TemporaryDirectory", CheckedDirectory):
                if value is LINE:
                    with self.assertRaises(ValidationError):
                        self.preview(document)
                else:
                    self.preview(document)

    def test_vector_read_error_is_validation_response(self):
        document = {"type": "Feature", "geometry": POLYGON, "crs": {"type": "name", "properties": {"name": "EPSG:4326"}}}
        with patch.object(boundary_imports, "DataSource", side_effect=boundary_imports.GDALException("invalid source")):
            with self.assertRaises(ValidationError) as caught:
                self.preview(document)
        self.assertIn("Cannot read", str(caught.exception.detail))
