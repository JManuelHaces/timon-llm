# Empezar

## Requisitos
- Python ≥ 3.12, [uv](https://docs.astral.sh/uv/), Node ≥ 20.

## Backend (mock, sin GPU)
```bash
uv sync                      # instala el workspace (backend + engine)
cp backend/.env.example backend/.env
uv run uvicorn app.main:app --app-dir backend --reload --port 8000
curl localhost:8000/healthz  # {"status":"ok","engine":"mock"}
```

## Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                  # http://localhost:3000
```

## Tests
```bash
uv run pytest -v             # backend + engine
```
