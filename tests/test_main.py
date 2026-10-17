from typing import Any

import pytest
import uvicorn

import cvdj


def test_main_starts_uvicorn_with_settings_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    # Replace uvicorn.run with a fake so the test doesn't start a real server.
    calls: list[tuple[tuple[Any, ...], dict[str, Any]]] = []
    monkeypatch.setattr(uvicorn, "run", lambda *args, **kwargs: calls.append((args, kwargs)))
    monkeypatch.setenv("CVDJ_PORT", "9123")

    cvdj.main()

    assert calls == [
        (("cvdj.app:app",), {"host": "127.0.0.1", "port": 9123, "log_level": "info"}),
    ]
