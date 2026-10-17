import json
from pathlib import Path

from fastapi.testclient import TestClient

from cvdj import __version__
from cvdj.app import create_app
from tests.factories import make_landmarks


def test_health_reports_ok_and_version(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": __version__}


def test_serves_the_built_frontend(client: TestClient) -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert "<title>ComputerVision_DJing</title>" in response.text


def test_explains_when_frontend_is_not_built(tmp_path: Path) -> None:
    client = TestClient(create_app(static_dir=tmp_path / "missing"))

    response = client.get("/")

    assert response.status_code == 503
    assert "npm run build" in response.text


def test_websocket_answers_ping_with_pong(client: TestClient) -> None:
    with client.websocket_connect("/ws") as ws:
        ws.send_json({"type": "ping", "sent_at": 123.5})

        assert ws.receive_json() == {"type": "pong", "sent_at": 123.5}


def test_websocket_turns_hands_into_features(client: TestClient) -> None:
    message = {
        "type": "hands",
        "timestamp": 1000,
        "aspect_ratio": 1,
        "hands": [{"handedness": "Right", "score": 0.9, "landmarks": make_landmarks()}],
    }
    with client.websocket_connect("/ws") as ws:
        ws.send_text(json.dumps(message))

        assert ws.receive_json() == {
            "type": "hand_features",
            "timestamp": 1000,
            "hands": [{"handedness": "Right", "pinch": 1.0}],
        }


def test_websocket_survives_a_bad_message(client: TestClient) -> None:
    with client.websocket_connect("/ws") as ws:
        ws.send_text("not json")
        assert ws.receive_json()["type"] == "error"

        # The connection is still usable afterwards.
        ws.send_json({"type": "ping", "sent_at": 1})
        assert ws.receive_json() == {"type": "pong", "sent_at": 1}
