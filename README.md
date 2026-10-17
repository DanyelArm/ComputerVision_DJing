# ComputerVision_DJing

[![CI](https://github.com/DanyelArm/ComputerVision_DJing/actions/workflows/ci.yml/badge.svg)](https://github.com/DanyelArm/ComputerVision_DJing/actions/workflows/ci.yml)

DJ with your body: your webcam captures your movements, computer vision turns them
into gestures, and the gestures control the mix.

## Architecture

```
Browser (webcam + audio)
   |  WebSocket: landmarks / commands
   v
Python backend (FastAPI) in Docker
   - gesture recognition
   - DJ logic (decks, tempo, effects)
```

The browser owns the camera and the speakers because a Docker container on
Windows can't reach either one. The backend does the thinking.

## Prerequisites

- [uv](https://docs.astral.sh/uv/) (Python project manager; it installs the right Python itself)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Development

```powershell
uv sync                         # create .venv and install everything from uv.lock
uv run pre-commit install       # run checks automatically on every commit (once per clone)
uv run cvdj                     # start the dev server on http://127.0.0.1:8000
```

Quality checks (CI runs exactly these):

```powershell
uv run ruff check .             # lint
uv run ruff format .            # auto-format
uv run mypy                     # type-check
uv run pytest                   # tests + coverage (fails under 80%)
```

## Local Docker deployment

```powershell
docker compose up --build       # build the image and run it; open http://localhost:8000
docker compose watch            # same, but rebuilds automatically when src/ changes
docker compose down             # stop and remove the container
```

## Configuration

Settings come from environment variables:

| Variable         | Default     | Purpose             |
|------------------|-------------|---------------------|
| `CVDJ_HOST`      | `127.0.0.1` | Interface to bind   |
| `CVDJ_PORT`      | `8000`      | Port to listen on   |
| `CVDJ_LOG_LEVEL` | `info`      | Uvicorn log level   |
