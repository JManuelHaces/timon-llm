# Timón — Scaffold Design Spec

**Fecha:** 2026-06-13
**Estado:** Aprobado para esqueleto (skeleton-only)
**Autores del proyecto:** José Manuel Haces · Rafael Juarez · Pablo Martínez
**Universidad Panamericana — Maestría en IA y Ciencia de Datos**

---

## 1. Qué es Timón

Middleware de **tono** para LLMs. Perillas semánticas continuas (Formalidad,
Urgencia, Calidez, Detalle, `0–100`) que aplican **activation steering** sobre
Gemma 2/3 usando **GemmaScope + SAELens**. El modelo es empujado *por dentro*,
token por token, en el forward pass — no se reescribe el texto como bloque ni se
reescribe el prompt.

- **Modo respuesta:** entra instrucción + perillas → genera respuesta con ese tono.
- **Modo reescritura:** entra texto existente → lo re-tonifica.
- **Presets de voz:** una marca calibra sus perillas una vez y las aplica a todo.

Meta SMART del proyecto: webapp desplegada con 4 perillas que re-tonifican en
vivo, steering estable y evaluado (≥80% de aciertos de tono), demostrado en 5
semanas (S1–S5).

## 2. Alcance de este scaffold

**Esqueleto/estructura** — carpetas, configs e **interfaces bien definidas**,
con stubs que corren y se testean de punta a punta usando un motor de steering
*mockeado* (sin GPU). La lógica real (Gemma, SAELens, eval) queda marcada con
`TODO` para que cada rol la rellene.

Fuera de alcance ahora: carga real de Gemma, hooks reales de SAELens, dataset de
evaluación real, lógica de calibración de features.

## 3. Arquitectura — monorepo `uv workspace`

```
timon-llm/
├── frontend/                  # Next.js (App Router, TS) → Vercel
│   ├── app/                   # consola de perillas, chat streaming, presets, panel features
│   ├── components/            # KnobConsole, ChatStream, PresetManager, FeaturePanel (stubs)
│   ├── lib/api.ts             # cliente del backend (SSE)
│   └── vercel.json
│
├── backend/                   # FastAPI async — API + streaming (ligero, sin GPU)
│   ├── app/
│   │   ├── main.py            # app FastAPI
│   │   ├── api/               # /chat (SSE), /presets (CRUD), /features
│   │   ├── db/                # SQLAlchemy async — SQLite (dev) / Postgres (prod)
│   │   ├── models/            # Preset, Feature
│   │   └── schemas/           # KnobVector, ChatRequest, PresetSchema (Pydantic)
│   ├── Dockerfile
│   └── pyproject.toml
│
├── engine/                    # paquete uv propio — steering ML (rol A)
│   ├── timon_engine/
│   │   ├── base.py            # SteeringEngine (ABC): interfaz que consume el backend
│   │   ├── mock.py            # MockSteeringEngine → backend corre SIN GPU
│   │   ├── gemma.py           # GemmaSteeringEngine (stub: Gemma 2/3 + SAELens/GemmaScope)
│   │   └── knobs.py           # mapeo perilla(0–100) → vector de steering
│   ├── eval/                  # harness de tono (rol C): dataset ejemplo + runner stub
│   ├── Dockerfile
│   └── pyproject.toml
│
├── docs/                      # onboarding para colaboradores (español)
│   ├── 00-overview.md
│   ├── 01-architecture.md
│   ├── 02-getting-started.md
│   ├── 03-deployment.md
│   ├── 04-roles.md
│   └── 05-glossary.md
│
├── docker-compose.yml         # dev local: backend + engine + postgres
├── .github/workflows/ci.yml   # lint (ruff) + tests (pytest) Python, lint/build frontend
├── pyproject.toml             # raíz: uv workspace (members: backend, engine)
├── .gitignore                 # (existente) + sección Claude / Python / Node / modelos
└── README.md                  # estilo Google, inglés, 3 colaboradores
```

## 4. Contratos clave

Esto es lo que hace del scaffold algo más que carpetas vacías. Todo lo demás se
puede cambiar sin tocar estas fronteras.

### 4.1 Perillas
```python
KnobVector { formality: int, urgency: int, warmth: int, detail: int }  # cada una 0–100
```

### 4.2 Interfaz Engine (frontera backend ↔ ML)
```python
class SteeringEngine(ABC):
    async def generate(
        self, prompt: str, knobs: KnobVector, mode: Literal["respuesta", "reescritura"]
    ) -> AsyncIterator[str]: ...
```
- `MockSteeringEngine` la implementa → el backend corre y se testea **sin GPU**.
- `GemmaSteeringEngine` queda como stub (Gemma 2/3 + SAELens/GemmaScope) — rol A.
- El backend depende **solo** de la ABC; el motor concreto se inyecta por config.

### 4.3 API (FastAPI)
- `POST /api/chat` → SSE, token por token. Body: `{ prompt, knobs, mode, preset_id? }`.
- `GET/POST/PUT/DELETE /api/presets` → CRUD de presets de voz.
- `GET /api/features` → lista de features de GemmaScope (panel de features).
- `GET /healthz` → liveness.

### 4.4 Persistencia
- SQLAlchemy **async**. **SQLite** en dev, **Postgres** en prod (mismo código).
- Modelos: `Preset(id, name, knobs, created_at)`, `Feature(id, name, layer, index, polarity)`.

## 5. Decisiones técnicas

| Tema | Decisión | Razón |
|------|----------|-------|
| Streaming | **SSE** (no WebSocket) | Simple, encaja con `StreamingResponse` y Vercel |
| DB | SQLAlchemy async, SQLite→Postgres | Mismo código dev/prod; compose levanta Postgres |
| Workspace | `uv` workspace (members: backend, engine) | Un solo `uv sync`; engine es dependencia del backend |
| Lint/format | `ruff` (Python), `eslint`/`prettier` (front) | Estándar, en CI |
| Tests | `pytest` (Python), build check (front) | En CI |

## 6. Topología de despliegue

**El LLM NO cabe en Vercel** (serverless, sin GPU, límites de tamaño/tiempo).

- **Vercel** → solo el **frontend** Next.js.
- **Host con GPU** → **backend + engine + Gemma** (Docker, portable):
  - **Cluster universidad (NVIDIA L4)** — opción de la presentación.
  - **RunPod** (pod GPU on-demand: L4 / A10 / A100) — alternativa flexible.
- Frontend → backend por HTTPS (`NEXT_PUBLIC_API_URL`).
- Sizing: Gemma 2 **2B** entra en L4 (24 GB); **9B** con cuantización. GemmaScope
  suma memoria. Detalle en `docs/03-deployment.md`.

## 7. Mapeo a roles y cronograma (de la presentación)

- **Rol A — Engine/ML:** `engine/timon_engine/gemma.py`, hooks SAELens, steering estable.
- **Rol B — Producto/Frontend:** `frontend/` (perillas, chat, presets, panel features).
- **Rol C — Calibración/Eval/Deploy:** `engine/eval/`, Docker, CI, deploy, demo.

S1 setup + steering por código · S2 API + perillas · S3 steering estable + features
· S4 eval + deploy · S5 demo + documentación.

## 8. Extras incluidos (todos confirmados)

- Eval harness (`engine/eval/`) — dataset ejemplo + runner stub.
- Docker (`backend/`, `engine/`) + `docker-compose.yml` + `vercel.json`.
- CI GitHub Actions — lint + tests.
- Presets con DB real (SQLAlchemy async).
- `docs/` de onboarding (español).
- `.gitignore` — **apéndice** al existente: `.claude/`, settings locales de Claude,
  `.env`, `__pycache__`, `.venv`, `node_modules`, `.next`, pesos de modelo
  (`*.safetensors`, `models/`), etc.
- `README.md` — estilo Google, **inglés**, con José Manuel Haces · Rafael Juarez ·
  Pablo Martínez.

## 9. Idioma

- **README.md** (público): inglés, estilo Google.
- **`docs/`** (equipo): español.
- Comentarios de código y `TODO`: español, breves.
