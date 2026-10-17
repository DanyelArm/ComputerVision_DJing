"""The web application: HTTP routes and the WebSocket the browser talks to."""

from importlib.resources import files

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse

from cvdj import __version__

STATIC_DIR = files("cvdj") / "static"


def create_app() -> FastAPI:
    """Build a fresh app instance (tests create their own, isolated ones)."""
    app = FastAPI(title="ComputerVision_DJing", version=__version__)

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "version": __version__}

    @app.get("/", response_class=HTMLResponse)
    def index() -> str:
        return (STATIC_DIR / "index.html").read_text(encoding="utf-8")

    @app.websocket("/ws")
    async def websocket_endpoint(websocket: WebSocket) -> None:
        # Placeholder: echoes messages back. Later this receives hand landmarks
        # from the browser and replies with DJ commands.
        await websocket.accept()
        try:
            while True:
                message = await websocket.receive_json()
                await websocket.send_json({"type": "echo", "received": message})
        except WebSocketDisconnect:
            pass

    return app


app = create_app()
