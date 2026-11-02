# Boundary import fix — Windows Django

## Findings from your files

- `polygon.geojson` contains one valid, closed WGS84 Polygon. Its coordinates need no conversion.
- The original `farm.geojson` contains a LineString. It is not a polygon and its first and last points differ. Boundary validation must reject it.
- The original importer keeps the final GDAL layer/feature alive while deleting its temporary directory. On Windows this can cause WinError 32 on successful imports as well as hide validation exceptions behind HTTP 500.

## Install

Stop Django (Ctrl+C). Extract this ZIP to a separate folder. In PowerShell, from your existing `backend` directory, back up these two files:

```powershell
Copy-Item .\apps\land\imports.py .\apps\land\imports.py.bak
Copy-Item .\apps\land\services.py .\apps\land\services.py.bak
```

Replace the corresponding files using this ZIP:

```text
apps/land/imports.py
apps/land/services.py
```

No migration, new package, GDAL downgrade, or frontend change is required. Keep your existing working OSGeo4W/PROJ configuration. Restart using your virtual environment:

```powershell
.\.venv\Scripts\python.exe manage.py runserver
```

Upload the included `polygon.geojson` first. The preview should return a polygon and `requires_confirmation: true`. Saving still requires the frontend's confirmation step; preview alone does not persist the boundary.

For the farm outline, review and then upload `farm-polygon-review.geojson`. It preserves the original vertex order and adds a final straight segment from the original last point to its first point. This is an explicit polygon conversion, not proof of the surveyed property boundary. The original farm upload is unchanged and will receive a clear HTTP 400 LineString validation error.

## Changes

- Standard GeoJSON is read directly into memory: no temporary GIS file lock.
- KML, ZIP shapefiles and legacy GeoJSON with an explicit CRS still use GDAL. Native handles are released before temporary files are deleted, including failure paths.
- Polygon/area validation happens only after vector file handles are released.
- Feature count, 20 MB upload limit and archive expansion limit remain enforced.
- Invalid geometry errors identify the feature and actual geometry type.
- Geometry repair must yield a valid, nonempty Polygon/MultiPolygon; collapsed lines and GeometryCollections are not silently accepted.
- Existing PostGIS area calculation and boundary-save business rules are retained. Other land service functions are unchanged.

## Tests

Optional: copy `tests/test_boundary_imports.py` to `apps/land/test_boundary_imports.py` and run:

```powershell
.\.venv\Scripts\python.exe manage.py test apps.land.test_boundary_imports
```

13 focused tests passed in an isolated Linux harness using Django 5.2, native GDAL 3.9.2 and GEOS 3.14.1. Tests cover the supplied shapes, conversion validity, malformed JSON/geometry, empty uploads, feature limits, repair, and native datasource release before cleanup on success and validation failure. The harness loads the geometry function without importing the rest of the unavailable Django project. Area is mocked in these tests; no live PostGIS connection or Windows filesystem test was performed. Your GDAL 3.13 environment needs the local upload check above.
