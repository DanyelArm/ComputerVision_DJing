from fastapi.testclient import TestClient

from cvdj import __version__


def test_health_reports_ok_and_version(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": __version__}


def test_index_serves_the_web_page(client: TestClient) -> None:
    response = client.get("/")

    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "<title>ComputerVision_DJing</title>" in response.text


def test_websocket_echoes_messages(client: TestClient) -> None:
    with client.websocket_connect("/ws") as ws:
        ws.send_json({"type": "ping", "sentAt": 123})

        assert ws.receive_json() == {
            "type": "echo",
            "received": {"type": "ping", "sentAt": 123},
        }
