import pytest

from cvdj.config import Settings


def test_defaults_when_no_env_vars_set(monkeypatch: pytest.MonkeyPatch) -> None:
    for name in ("CVDJ_HOST", "CVDJ_PORT", "CVDJ_LOG_LEVEL"):
        monkeypatch.delenv(name, raising=False)

    assert Settings.from_env() == Settings(host="127.0.0.1", port=8000, log_level="info")


def test_env_vars_override_defaults(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CVDJ_HOST", "0.0.0.0")
    monkeypatch.setenv("CVDJ_PORT", "9000")
    monkeypatch.setenv("CVDJ_LOG_LEVEL", "debug")

    assert Settings.from_env() == Settings(host="0.0.0.0", port=9000, log_level="debug")


def test_invalid_port_fails_loudly(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CVDJ_PORT", "not-a-number")

    with pytest.raises(ValueError):
        Settings.from_env()
