"""The web application: HTTP routes, the WebSocket, and the built frontend."""

from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from cvdj import __version__
from cvdj.handlers import handle_message

# `npm run build` in frontend/ writes the compiled frontend here.
DEFAULT_STATIC_DIR = Path(__file__).parent / "static"

FRONTEND_MISSING_PAGE = """<!doctype html>
<title>ComputerVision_DJing</title>
<p>The frontend hasn't been built yet. Run <code>npm run build</code> in
<code>frontend/</code>, or use <code>npm run dev</code> during development.</p>
"""


def create_app(static_dir: Path = DEFAULT_STATIC_DIR) -> FastAPI:
    """Build a fresh app instance (tests pass their own static_dir)."""
    app = FastAPI(title="ComputerVision_DJing", version=__version__)

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "version": __version__}

    @app.websocket("/ws")
    async def websocket_endpoint(websocket: WebSocket) -> None:
        await websocket.accept()
        try:
            while True:
                reply = handle_message(await websocket.receive_text())
                await websocket.send_text(reply.model_dump_json())
        except WebSocketDisconnect:
            pass

    # Mounted last: "/" matches every path, so the routes above must win first.
    if (static_dir / "index.html").is_file():
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="frontend")
    else:

        @app.get("/", response_class=HTMLResponse, status_code=503)
        def frontend_missing() -> str:
            return FRONTEND_MISSING_PAGE

    return app


app = create_app()
