# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1 — builder: install dependencies and the app into a virtualenv.
# Has uv and build caches; none of that ends up in the final image.
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:0.12.24 /uv /bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# Dependencies first, project code second: dependencies change rarely, so this
# layer stays cached and rebuilds after a code change take seconds.
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-dev --no-install-project

COPY pyproject.toml uv.lock README.md ./
COPY src ./src
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev --no-editable

# ---------------------------------------------------------------------------
# Stage 2 — runtime: just Python and the finished virtualenv.
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS runtime

# Never run as root inside the container.
RUN groupadd --system app && useradd --system --gid app --no-create-home app

COPY --from=builder --chown=app:app /app/.venv /app/.venv

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    CVDJ_HOST=0.0.0.0 \
    CVDJ_PORT=8000

USER app
EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)"]

CMD ["cvdj"]
