from apps.land.models import Block, BlockBoundaryRevision
from apps.land.services import set_boundary
from apps.catalogue.models import Unit


def test_postgis_geodesic_boundary(ctx):
    block = Block.objects.create(
        farm=ctx.farm,
        code="A",
        name="A",
        area_value=10000,
        area_m2=10000,
        area_unit=Unit.objects.get(farm=None, code="m2"),
    )
    g = {
        "type": "Polygon",
        "coordinates": [[[79, 21], [79.001, 21], [79.001, 21.001], [79, 21.001], [79, 21]]],
    }
    block = set_boundary(ctx, block.pk, g, 1)
    assert 10000 < block.area_m2 < 13000
    assert BlockBoundaryRevision.objects.filter(block=block).count() == 1
    assert block.centroid.srid == 4326
