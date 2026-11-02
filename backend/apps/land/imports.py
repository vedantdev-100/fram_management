import json
import tempfile
import zipfile
from pathlib import Path

from django.contrib.gis.gdal import DataSource, GDALException
from rest_framework.exceptions import ValidationError

from .services import area, geometry

MAX_UPLOAD = 20 * 1024 * 1024
MAX_FEATURES = 1000


def _read_geojson(upload):
    # GeoJSON uses WGS84 longitude/latitude unless a legacy CRS is declared.
    # Reading JSON directly also avoids a Windows file lock for this format.
    try:
        document = json.loads(upload.read().decode("utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValidationError("The upload is not valid UTF-8 GeoJSON.") from exc
    if not isinstance(document, dict):
        raise ValidationError("GeoJSON must be an object.")
    if document.get("crs") is not None:
        # Let GDAL interpret older, explicitly projected GeoJSON documents.
        upload.seek(0)
        return None
    kind = document.get("type")
    if kind == "FeatureCollection":
        items = document.get("features")
        if not isinstance(items, list):
            raise ValidationError("FeatureCollection.features must be an array.")
    elif kind == "Feature":
        items = [document]
    else:
        items = [{"type": "Feature", "geometry": document}]
    if not items:
        raise ValidationError("The file contains no boundary features.")
    if len(items) > MAX_FEATURES:
        raise ValidationError("Maximum 1000 features per preview.")
    records = []
    for index, item in enumerate(items):
        if not isinstance(item, dict) or item.get("type") != "Feature":
            raise ValidationError(f"Feature {index + 1} must be a GeoJSON Feature.")
        value = item.get("geometry")
        if not isinstance(value, dict):
            raise ValidationError(f"Feature {index + 1} has no geometry.")
        records.append((value, index))
    return records


def _extract_shapefile(path, root):
    try:
        with zipfile.ZipFile(path) as archive:
            members = archive.infolist()
            if len(members) > 100 or sum(x.file_size for x in members) > 100 * 1024 * 1024:
                raise ValidationError("Expanded archive exceeds limits.")
            seen = set()
            for info in members:
                name = Path(info.filename.replace("\\", "/"))
                if name.is_absolute() or ".." in name.parts or ":" in info.filename:
                    raise ValidationError("Archive contains an unsafe member.")
                if info.is_dir():
                    continue
                if (info.external_attr >> 16) & 0o170000 == 0o120000:
                    raise ValidationError("Archive links are not supported.")
                if name.suffix.lower() not in (".shp", ".shx", ".dbf", ".prj", ".cpg", ".qix"):
                    raise ValidationError("Archive contains an unsupported member.")
                if name.name.lower() in seen:
                    raise ValidationError("Archive contains duplicate component names.")
                seen.add(name.name.lower())
                (root / name.name).write_bytes(archive.read(info))
    except zipfile.BadZipFile as exc:
        raise ValidationError("The upload is not a valid ZIP archive.") from exc
    shapes = [p for p in root.iterdir() if p.suffix.lower() == ".shp"]
    if len(shapes) != 1:
        raise ValidationError("Archive must contain exactly one shapefile.")
    return shapes[0]


def _read_vector(path):
    """Return detached JSON values, never native GDAL wrappers or exceptions.

    A Feature retains its Layer, and a Layer retains its DataSource. Release all
    references before the caller deletes its temporary directory. Validation of
    polygon type/area happens afterwards so its traceback cannot retain GDAL.
    """
    datasource = layer = feature = g = None
    records = []
    error = None
    try:
        datasource = DataSource(str(path))
        for layer in datasource:
            if len(records) + len(layer) > MAX_FEATURES:
                raise ValidationError("Maximum 1000 features per preview.")
            for feature in layer:
                g = feature.geom
                if not g or not g.srs:
                    raise ValidationError("Feature has no geometry or coordinate reference system.")
                g.transform(4326)
                records.append((json.loads(g.json), feature.fid))
    except ValidationError as exc:
        error = exc.detail
    except (GDALException, ValueError, TypeError) as exc:
        error = f"Cannot read or transform the boundary file: {exc}"
    finally:
        # Order matters: child wrappers may own references to the datasource.
        g = None
        feature = None
        layer = None
        datasource = None
    return records, error


def _preview(records):
    if not records:
        raise ValidationError("The file contains no boundary features.")
    features = []
    for index, (value, source_id) in enumerate(records, start=1):
        try:
            repaired = geometry(value, repair=True)
        except ValidationError as exc:
            raise ValidationError({"feature": index, "source_id": source_id, "geometry": exc.detail}) from None
        area_m2 = area(repaired)
        if area_m2 <= 0:
            raise ValidationError(f"Feature {index} has zero area.")
        features.append({
            "type": "Feature",
            "geometry": json.loads(repaired.geojson),
            "properties": {"area_m2": str(area_m2), "source_id": source_id},
        })
    return {"type": "FeatureCollection", "features": features, "requires_confirmation": True}


def preview_upload(upload):
    if upload.size > MAX_UPLOAD:
        raise ValidationError("Boundary upload maximum is 20 MB.")
    suffix = Path(upload.name).suffix.lower()
    if suffix not in (".geojson", ".json", ".kml", ".zip"):
        raise ValidationError("Use GeoJSON, KML, or zipped shapefile.")
    if suffix in (".geojson", ".json"):
        records = _read_geojson(upload)
        if records is not None:
            return _preview(records)
    with tempfile.TemporaryDirectory() as temp:
        root = Path(temp)
        path = root / ("boundary" + suffix)
        with path.open("wb") as stream:
            for chunk in upload.chunks():
                stream.write(chunk)
        if suffix == ".zip":
            path = _extract_shapefile(path, root)
        records, error = _read_vector(path)
    # No native datasource or file handles survive this point.
    if error is not None:
        raise ValidationError(error)
    return _preview(records)
