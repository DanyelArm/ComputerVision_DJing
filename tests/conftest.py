"""Shared pytest fixtures, available to every test file automatically."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from cvdj.app import create_app

FAKE_INDEX_HTML = "<!doctype html><title>ComputerVision_DJing</title>"


@pytest.fixture
def static_dir(tmp_path: Path) -> Path:
    """A stand-in for the built frontend, so backend tests don't need Node."""
    (tmp_path / "index.html").write_text(FAKE_INDEX_HTML, encoding="utf-8")
    return tmp_path


@pytest.fixture
def client(static_dir: Path) -> TestClient:
    return TestClient(create_app(static_dir=static_dir))
