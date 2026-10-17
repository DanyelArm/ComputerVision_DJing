"""Shared pytest fixtures, available to every test file automatically."""

import pytest
from fastapi.testclient import TestClient

from cvdj.app import create_app


@pytest.fixture
def client() -> TestClient:
    return TestClient(create_app())
