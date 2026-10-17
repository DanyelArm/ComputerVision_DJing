"""ComputerVision_DJing: DJ with your body, via the webcam."""

from importlib.metadata import version

__version__ = version("cvdj")


def main() -> None:
    """Entry point for the `cvdj` command: start the web server."""
    import uvicorn

    from cvdj.config import Settings

    settings = Settings.from_env()
    uvicorn.run(
        "cvdj.app:app",
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level,
    )
