import pytest
from django.core.management import call_command
from apps.identity.models import User
from apps.identity.services import create_farm
from apps.identity.access import Context


@pytest.fixture
def owner(db):
    call_command("seed_system", verbosity=0)
    return User.objects.create_user("owner@example.test", "Strong-password-42", full_name="Owner")


@pytest.fixture
def ctx(owner):
    farm = create_farm(owner, {"name": "Test Farm", "slug": "test-farm"})
    return Context.resolve(owner, farm.pk)
