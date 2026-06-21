# Imagen del API (ligera, sin GPU). El engine real con GPU usa engine/Dockerfile.
FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app

# Copia el workspace (raíz + miembros) para resolver timon-engine.
COPY pyproject.toml uv.lock ./
COPY backend ./backend
COPY engine ./engine

RUN uv lock --upgrade && uv sync --frozen --package timon-backend --extra postgres

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000"]
