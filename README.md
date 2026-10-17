# ComputerVision_DJing

[![CI](https://github.com/DanyelArm/ComputerVision_DJing/actions/workflows/ci.yml/badge.svg)](https://github.com/DanyelArm/ComputerVision_DJing/actions/workflows/ci.yml)

DJ with your body: your webcam captures your movements, computer vision turns them
into gestures, and the gestures control the mix.

## Architecture

```
Browser (frontend/, TypeScript)
  webcam -> MediaPipe Hand Landmarker (WebAssembly, GPU)
         -> 21 landmarks per hand, every frame
            |  WebSocket /ws  (JSON, ~1 KB per frame)
            v
Python backend (src/cvdj/, FastAPI) — runs in Docker
  validate (protocol.py) -> measure (gestures.py) -> reply (handlers.py)
```

The browser owns the camera and the speakers, because a Docker container on
Windows can't reach either one; the backend does the thinking. The message
format lives in `frontend/src/protocol.ts` and `src/cvdj/protocol.py`, which
must be kept in sync.

## Prerequisites

- [uv](https://docs.astral.sh/uv/): Python project manager (installs the right Python itself)
- [Node.js 24 LTS](https://nodejs.org/): for the frontend tooling
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Development

One-time setup per clone:

```powershell
uv sync                         # Python: create .venv from uv.lock
npm ci --prefix frontend        # Frontend: install node_modules from package-lock.json
uv run pre-commit install       # run checks automatically on every commit
```

Run the app with hot reload in two terminals:

```powershell
uv run cvdj                     # terminal 1: backend on http://127.0.0.1:8000
npm run dev --prefix frontend   # terminal 2: frontend on http://localhost:5173  <- open this
```

The Vite dev server reloads the page as soon as you save a frontend file, and
forwards `/ws` and `/health` to the backend.

## Quality checks (CI runs exactly these)

```powershell
# Python
uv run ruff check .             # lint
uv run ruff format .            # auto-format
uv run mypy                     # type-check
uv run pytest                   # tests + coverage (fails under 80%)

# Frontend (from frontend/)
npm run format                  # auto-format (Prettier)
npm run lint                    # ESLint
npm run typecheck               # TypeScript compiler
npm test                        # Vitest
```

## Local Docker deployment

```powershell
docker compose up --build       # build the image and run it; open http://localhost:8000
docker compose watch            # same, but rebuilds automatically when sources change
docker compose down             # stop and remove the container
```

The image is built in three stages: Node compiles the frontend, uv installs the
Python app, and the final image keeps only Python plus the results.

## Configuration

Settings come from environment variables:

| Variable         | Default     | Purpose             |
|------------------|-------------|---------------------|
| `CVDJ_HOST`      | `127.0.0.1` | Interface to bind   |
| `CVDJ_PORT`      | `8000`      | Port to listen on   |
| `CVDJ_LOG_LEVEL` | `info`      | Uvicorn log level   |
