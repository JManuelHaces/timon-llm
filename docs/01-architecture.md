# Arquitectura

Monorepo `uv` workspace con dos miembros Python (`backend`, `engine`) y un
frontend Next.js.

```
frontend/  → Next.js (Vercel). Perillas, chat streaming, presets, features.
backend/   → FastAPI async. API + SSE. Depende solo de la ABC SteeringEngine.
engine/    → paquete uv. SteeringEngine (ABC), MockSteeringEngine, GemmaSteeringEngine (stub), eval/.
```

## Contratos (las fronteras estables)

- **Perillas:** `KnobVector{formality,urgency,warmth,detail}`, cada una 0–100.
- **Engine:** `SteeringEngine.generate(prompt, knobs, mode) -> AsyncIterator[str]`.
  El backend inyecta el motor según `TIMON_ENGINE` (`mock` | `gemma`).
- **API:** `POST /api/chat` (SSE) · `GET/POST/PUT/DELETE /api/presets` · `GET /api/features` · `GET /healthz`.
- **DB:** SQLAlchemy async — SQLite (dev) / Postgres (prod). Modelos `Preset`, `Feature`.

El `MockSteeringEngine` permite correr y testear todo **sin GPU**.
