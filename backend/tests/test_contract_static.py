"""Checks that do not require a running PostgreSQL instance."""

import uuid
import pytest
from django.apps import apps
from django.db.migrations.loader import MigrationLoader
from rest_framework.test import APIClient
from apps.core.resources import RESOURCES
from apps.core.serializers import serializer_for


@pytest.mark.parametrize("label", list(RESOURCES.values()))
def test_every_resource_has_valid_serializer(label):
    serializer = serializer_for(apps.get_model(label))()
    assert "id" in serializer.fields
    assert "farm" in serializer.fields
    assert serializer.fields["farm"].read_only


@pytest.mark.parametrize("resource", list(RESOURCES))
def test_every_resource_requires_authentication(resource):
    response = APIClient().get(f"/api/v1/farms/{uuid.uuid4()}/{resource}/")
    assert response.status_code == 401


def test_migration_graph_is_acyclic():
    loader = MigrationLoader(None)
    loader.graph.ensure_not_cyclic()
    for node in loader.graph.leaf_nodes():
        loader.graph.forwards_plan(node)
