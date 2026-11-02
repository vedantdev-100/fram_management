import pytest
from rest_framework.test import APIClient
from apps.identity.models import User, Membership, Role
from apps.assets.models import Asset, StockItem
from apps.catalogue.models import Unit
from apps.identity.services import create_farm


def test_registration_and_login(db):
    c = APIClient()
    assert (
        c.post(
            "/api/v1/auth/register/",
            {"email": "new@example.test", "full_name": "New", "password": "a-long-Unique-password-42"},
            format="json",
        ).status_code
        == 201
    )
    r = c.post(
        "/api/v1/auth/token/",
        {"email": "new@example.test", "password": "a-long-Unique-password-42"},
        format="json",
    )
    assert r.status_code == 200 and "access" in r.data
    c.credentials(HTTP_AUTHORIZATION="Bearer " + r.data["access"])
    assert c.get("/api/v1/auth/me/").status_code == 200


def test_farm_scoping(ctx, owner):
    c = APIClient()
    c.force_authenticate(owner)
    other_user = User.objects.create_user("other@example.test", "Strong-password-42", full_name="Other")
    other = create_farm(other_user, {"name": "Other", "slug": "other"})
    assert c.get(f"/api/v1/farms/{other.pk}/assets/").status_code == 404
    assert c.get(f"/api/v1/farms/{ctx.farm.pk}/assets/").status_code == 200


def test_readonly_stock_caches(ctx, owner):
    c = APIClient()
    c.force_authenticate(owner)
    asset = Asset.objects.create(farm=ctx.farm, asset_class="stock", code="S", name="Stock")
    r = c.post(
        f"/api/v1/farms/{ctx.farm.pk}/stock-items/",
        {
            "asset": str(asset.pk),
            "base_unit": str(Unit.objects.get(farm=None, code="kg").pk),
            "on_hand_qty": "100",
        },
        format="json",
    )
    assert r.status_code == 400
    assert not StockItem.objects.filter(asset=asset).exists()


@pytest.mark.parametrize(
    "role,allowed",
    [
        ("owner", True),
        ("manager", True),
        ("worker", False),
        ("viewer", False),
        ("accountant", False),
        ("advisor", False),
        ("supervisor", False),
    ],
)
def test_asset_write_role_matrix(ctx, role, allowed):
    u = User.objects.create_user(role + "@example.test", "Strong-password-42", full_name=role)
    Membership.objects.create(
        farm=ctx.farm, user=u, role=Role.objects.get(farm=ctx.farm, code=role), status="active"
    )
    c = APIClient()
    c.force_authenticate(u)
    r = c.post(
        f"/api/v1/farms/{ctx.farm.pk}/assets/",
        {"asset_class": "machine", "name": "Tractor", "code": "T"},
        format="json",
    )
    assert r.status_code == (201 if allowed else 403)
