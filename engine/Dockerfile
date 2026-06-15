# Imagen del motor real con GPU (rol A). Para cluster L4 o RunPod.
# TODO(rol A): fijar versión de CUDA/torch al entorno de despliegue.
FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04

RUN apt-get update && apt-get install -y python3.12 python3-pip git && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app
COPY pyproject.toml uv.lock ./
COPY engine ./engine
COPY backend ./backend

# Instala el engine con extras de GPU (torch, transformers, sae-lens).
RUN uv sync --frozen --package timon-backend --extra postgres \
    && uv pip install -e "./engine[gpu]"

EXPOSE 8000
# Sirve el MISMO API pero con TIMON_ENGINE=gemma.
ENV TIMON_ENGINE=gemma
CMD ["uv", "run", "uvicorn", "app.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000"]
