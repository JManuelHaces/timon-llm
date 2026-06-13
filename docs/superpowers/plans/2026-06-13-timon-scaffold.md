# Timón Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Timón monorepo (Next.js frontend + FastAPI backend + `engine` ML package) as a runnable skeleton with well-defined interfaces and a mock steering engine, so the three collaborators can fill in their parts.

**Architecture:** `uv` workspace with two Python members (`backend`, `engine`) plus a `frontend/` Next.js app. The backend depends only on the `SteeringEngine` ABC from `engine`; a `MockSteeringEngine` lets everything run end-to-end without a GPU. `GemmaSteeringEngine`, the eval harness, and feature calibration are stubs marked with `TODO`.

**Tech Stack:** Python 3.13, uv, FastAPI (async, SSE), SQLAlchemy async (SQLite dev / Postgres prod), Pydantic v2, pytest, ruff; Next.js (App Router, TypeScript); Docker, docker-compose, GitHub Actions; Vercel (frontend) + RunPod/cluster GPU (backend+engine).

**Reference spec:** `docs/superpowers/specs/2026-06-13-timon-scaffold-design.md`

**Conventions for this plan:**
- All commands run from repo root: `timon-llm/` unless stated.
- Python deps installed via `uv sync` at root (workspace).
- Where a step adds Python logic, it follows test-first (TDD). Config/docs/frontend stubs are created directly.
- Comments and `TODO`s in code are in Spanish (short); README in English; `docs/` in Spanish.

---

## Task 1: Root uv workspace + tooling

**Files:**
- Create: `pyproject.toml` (root workspace)
- Create: `.python-version`
- Create: `ruff.toml`

- [ ] **Step 1: Create root workspace `pyproject.toml`**

Create `pyproject.toml`:

```toml
[project]
name = "timon"
version = "0.1.0"
description = "Timón — middleware de tono para LLMs (activation steering sobre Gemma)"
requires-python = ">=3.12"
readme = "README.md"

[tool.uv.workspace]
members = ["backend", "engine"]

[tool.uv.sources]
timon-engine = { workspace = true }

[dependency-groups]
dev = ["ruff>=0.6", "pytest>=8", "pytest-asyncio>=0.24", "httpx>=0.27"]
```

- [ ] **Step 2: Create `.python-version`**

Create `.python-version`:

```
3.12
```

- [ ] **Step 3: Create `ruff.toml`**

Create `ruff.toml`:

```toml
line-length = 100
target-version = "py312"

[lint]
select = ["E", "F", "I", "UP", "B"]

[lint.isort]
known-first-party = ["timon_engine", "app"]
```

- [ ] **Step 4: Commit**

```bash
git add pyproject.toml .python-version ruff.toml
git commit -m "chore: root uv workspace + ruff config"
```

---

## Task 2: Engine package — knobs mapping (TDD)

**Files:**
- Create: `engine/pyproject.toml`
- Create: `engine/timon_engine/__init__.py`
- Create: `engine/timon_engine/knobs.py`
- Test: `engine/tests/test_knobs.py`

- [ ] **Step 1: Create `engine/pyproject.toml`**

Create `engine/pyproject.toml`:

```toml
[project]
name = "timon-engine"
version = "0.1.0"
description = "Motor de steering de Timón (Gemma 2/3 + SAELens/GemmaScope)"
requires-python = ">=3.12"
dependencies = ["pydantic>=2"]

[project.optional-dependencies]
# Dependencias pesadas reales (rol A las activa cuando haya GPU).
gpu = ["torch>=2.3", "transformers>=4.44", "sae-lens>=3"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["timon_engine"]
```

- [ ] **Step 2: Create package init**

Create `engine/timon_engine/__init__.py`:

```python
"""Timón engine: interfaz de steering y motores (mock + Gemma)."""

from timon_engine.base import SteeringEngine
from timon_engine.knobs import KnobVector, knobs_to_steering_vector
from timon_engine.mock import MockSteeringEngine

__all__ = [
    "SteeringEngine",
    "KnobVector",
    "knobs_to_steering_vector",
    "MockSteeringEngine",
]
```

- [ ] **Step 3: Write the failing test for knobs**

Create `engine/tests/test_knobs.py`:

```python
import pytest
from pydantic import ValidationError

from timon_engine.knobs import KnobVector, knobs_to_steering_vector


def test_knobvector_defaults_to_50():
    k = KnobVector()
    assert k.formality == 50
    assert k.urgency == 50
    assert k.warmth == 50
    assert k.detail == 50


def test_knobvector_rejects_out_of_range():
    with pytest.raises(ValidationError):
        KnobVector(formality=101)


def test_knobs_to_steering_vector_centers_at_zero():
    # 50 = neutro → 0.0 ; rango -1.0..1.0
    vec = knobs_to_steering_vector(KnobVector())
    assert vec == {"formality": 0.0, "urgency": 0.0, "warmth": 0.0, "detail": 0.0}


def test_knobs_to_steering_vector_extremes():
    vec = knobs_to_steering_vector(KnobVector(formality=100, urgency=0))
    assert vec["formality"] == pytest.approx(1.0)
    assert vec["urgency"] == pytest.approx(-1.0)
```

- [ ] **Step 4: Run test to verify it fails**

Run: `uv run pytest engine/tests/test_knobs.py -v`
Expected: FAIL (ModuleNotFoundError / cannot import `knobs`).

- [ ] **Step 5: Implement `knobs.py`**

Create `engine/timon_engine/knobs.py`:

```python
"""Perillas semánticas y su mapeo a un vector de steering normalizado."""

from pydantic import BaseModel, Field

# Nombres de las 4 perillas (slide 4 de la presentación).
KNOB_NAMES = ("formality", "urgency", "warmth", "detail")


class KnobVector(BaseModel):
    """Estado de las 4 perillas. Cada una 0–100 (50 = neutro)."""

    formality: int = Field(default=50, ge=0, le=100)
    urgency: int = Field(default=50, ge=0, le=100)
    warmth: int = Field(default=50, ge=0, le=100)
    detail: int = Field(default=50, ge=0, le=100)


def knobs_to_steering_vector(knobs: KnobVector) -> dict[str, float]:
    """Convierte 0–100 a un coeficiente -1.0..1.0 (50 → 0.0).

    El motor real (Gemma) multiplica cada coeficiente por la dirección de su
    feature de GemmaScope. Aquí solo normalizamos; la dirección la pone el motor.
    """
    return {name: (getattr(knobs, name) - 50) / 50.0 for name in KNOB_NAMES}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `uv run pytest engine/tests/test_knobs.py -v`
Expected: PASS (4 passed).

- [ ] **Step 7: Commit**

```bash
git add engine/pyproject.toml engine/timon_engine/__init__.py engine/timon_engine/knobs.py engine/tests/test_knobs.py
git commit -m "feat(engine): perillas KnobVector + mapeo a vector de steering"
```

---

## Task 3: Engine — SteeringEngine ABC + MockSteeringEngine (TDD)

**Files:**
- Create: `engine/timon_engine/base.py`
- Create: `engine/timon_engine/mock.py`
- Test: `engine/tests/test_mock.py`

- [ ] **Step 1: Write the failing test for the mock engine**

Create `engine/tests/test_mock.py`:

```python
import pytest

from timon_engine.knobs import KnobVector
from timon_engine.mock import MockSteeringEngine


@pytest.mark.asyncio
async def test_mock_streams_tokens():
    engine = MockSteeringEngine()
    chunks = [c async for c in engine.generate("hola", KnobVector(), "respuesta")]
    assert len(chunks) > 0
    assert "".join(chunks).strip() != ""


@pytest.mark.asyncio
async def test_mock_reflects_high_formality():
    engine = MockSteeringEngine()
    out = "".join(
        [c async for c in engine.generate("hola", KnobVector(formality=100), "respuesta")]
    )
    # El mock anota el tono aplicado para que el frontend sea verificable.
    assert "formality" in out.lower()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest engine/tests/test_mock.py -v`
Expected: FAIL (cannot import `mock`).

- [ ] **Step 3: Implement the ABC**

Create `engine/timon_engine/base.py`:

```python
"""Interfaz que el backend consume. El motor concreto se inyecta por config."""

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from typing import Literal

from timon_engine.knobs import KnobVector

Mode = Literal["respuesta", "reescritura"]


class SteeringEngine(ABC):
    """Contrato de generación con steering. Implementaciones: Mock, Gemma."""

    @abstractmethod
    def generate(
        self, prompt: str, knobs: KnobVector, mode: Mode
    ) -> AsyncIterator[str]:
        """Devuelve un stream async de tokens/strings ya con el tono aplicado."""
        ...
```

- [ ] **Step 4: Implement the mock**

Create `engine/timon_engine/mock.py`:

```python
"""Motor mock: corre sin GPU. Simula el empujón y lo hace observable."""

import asyncio
from collections.abc import AsyncIterator

from timon_engine.base import Mode, SteeringEngine
from timon_engine.knobs import KnobVector, knobs_to_steering_vector


class MockSteeringEngine(SteeringEngine):
    """No carga ningún modelo. Devuelve un texto que refleja las perillas.

    Sirve para desarrollar frontend + API end-to-end. Rol A lo reemplaza por
    GemmaSteeringEngine cuando el steering real esté listo.
    """

    async def generate(
        self, prompt: str, knobs: KnobVector, mode: Mode
    ) -> AsyncIterator[str]:
        vec = knobs_to_steering_vector(knobs)
        applied = ", ".join(f"{name}={coef:+.2f}" for name, coef in vec.items())
        text = (
            f"[mock · modo={mode}] Respuesta de Timón a: «{prompt[:60]}». "
            f"Tono aplicado → {applied}."
        )
        for word in text.split(" "):
            await asyncio.sleep(0)  # cede el control: simula streaming token a token
            yield word + " "
```

- [ ] **Step 5: Run test to verify it passes**

Run: `uv run pytest engine/tests/test_mock.py -v`
Expected: PASS (2 passed).

- [ ] **Step 6: Add pytest-asyncio config**

Append to `engine/pyproject.toml`:

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
```

- [ ] **Step 7: Run full engine test suite**

Run: `uv run pytest engine/tests/ -v`
Expected: PASS (all green).

- [ ] **Step 8: Commit**

```bash
git add engine/timon_engine/base.py engine/timon_engine/mock.py engine/tests/test_mock.py engine/pyproject.toml
git commit -m "feat(engine): SteeringEngine ABC + MockSteeringEngine"
```

---

## Task 4: Engine — GemmaSteeringEngine stub

**Files:**
- Create: `engine/timon_engine/gemma.py`

- [ ] **Step 1: Create the Gemma stub**

Create `engine/timon_engine/gemma.py`:

```python
"""Stub del motor real. ROL A: rellenar con Gemma 2/3 + SAELens/GemmaScope.

Plan (de la presentación):
- Cargar Gemma 2/3 (servido en cluster L4 o RunPod).
- Cargar SAEs pre-entrenados de GemmaScope (NO entrenar desde cero).
- Registrar hooks de SAELens en el forward pass.
- En cada paso de decodificación, sumar Σ coef_perilla · dirección_feature
  a las activaciones de la capa objetivo (el "empujón").
- Mapear cada perilla a su(s) feature(s) curado(s) (ver engine/eval + Neuronpedia).
"""

from collections.abc import AsyncIterator

from timon_engine.base import Mode, SteeringEngine
from timon_engine.knobs import KnobVector


class GemmaSteeringEngine(SteeringEngine):
    def __init__(self, model_name: str = "google/gemma-2-2b-it", device: str = "cuda"):
        self.model_name = model_name
        self.device = device
        # TODO(rol A): cargar modelo, tokenizer y SAEs de GemmaScope aquí.

    async def generate(
        self, prompt: str, knobs: KnobVector, mode: Mode
    ) -> AsyncIterator[str]:
        raise NotImplementedError(
            "GemmaSteeringEngine es un stub. Rol A: implementar carga de Gemma + "
            "hooks de SAELens y generación con steering. Mientras tanto usar "
            "MockSteeringEngine (TIMON_ENGINE=mock)."
        )
        yield  # pragma: no cover  (marca la función como generador async)
```

- [ ] **Step 2: Verify it imports without GPU deps**

Run: `uv run python -c "from timon_engine.gemma import GemmaSteeringEngine; print('ok')"`
Expected: prints `ok` (no torch import at module load).

- [ ] **Step 3: Commit**

```bash
git add engine/timon_engine/gemma.py
git commit -m "feat(engine): stub GemmaSteeringEngine (rol A)"
```

---

## Task 5: Engine — eval harness stub

**Files:**
- Create: `engine/eval/__init__.py`
- Create: `engine/eval/dataset.example.jsonl`
- Create: `engine/eval/run_eval.py`
- Create: `engine/eval/README.md`

- [ ] **Step 1: Create eval package init**

Create `engine/eval/__init__.py`:

```python
"""Harness de evaluación de tono (rol C). Meta SMART: ≥80% de aciertos."""
```

- [ ] **Step 2: Create example dataset**

Create `engine/eval/dataset.example.jsonl`:

```jsonl
{"prompt": "Avísale al cliente que su pedido se retrasó", "knobs": {"formality": 90, "urgency": 70, "warmth": 60, "detail": 50}, "expected_tone": "formal y empático"}
{"prompt": "Confirma la cita de mañana", "knobs": {"formality": 30, "urgency": 40, "warmth": 80, "detail": 30}, "expected_tone": "cercano y breve"}
```

- [ ] **Step 3: Create the eval runner stub**

Create `engine/eval/run_eval.py`:

```python
"""Runner del harness de tono. ROL C: implementar el juez de tono.

Uso previsto:
    uv run python -m eval.run_eval --dataset engine/eval/dataset.example.jsonl

Flujo (a implementar):
1. Cargar el dataset (.jsonl): prompt + knobs + expected_tone.
2. Para cada fila, generar con el motor (mock o Gemma).
3. Juzgar el tono de la salida vs expected_tone (LLM-juez o clasificador).
4. Reportar accuracy global; objetivo ≥ 0.80.
"""

import argparse
import json
from pathlib import Path


def load_dataset(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def main() -> None:
    parser = argparse.ArgumentParser(description="Harness de evaluación de tono de Timón")
    parser.add_argument("--dataset", type=Path, default=Path("engine/eval/dataset.example.jsonl"))
    args = parser.parse_args()

    rows = load_dataset(args.dataset)
    print(f"Cargadas {len(rows)} filas de {args.dataset}")
    # TODO(rol C): generar con el motor + juez de tono + accuracy.
    raise SystemExit("Harness no implementado todavía (stub). Ver docstring.")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Create eval README**

Create `engine/eval/README.md`:

```markdown
# Eval harness (rol C)

Harness de evaluación de tono. Meta SMART: ≥ 80% de aciertos.

- `dataset.example.jsonl` — ejemplo del formato (prompt + knobs + expected_tone).
- `run_eval.py` — runner (stub). Ver docstring para el flujo a implementar.

```bash
uv run python -m eval.run_eval --dataset engine/eval/dataset.example.jsonl
```
```

- [ ] **Step 5: Verify dataset loads**

Run: `uv run python -c "from pathlib import Path; from eval.run_eval import load_dataset; print(len(load_dataset(Path('engine/eval/dataset.example.jsonl'))))"`
Expected: prints `2`.

- [ ] **Step 6: Commit**

```bash
git add engine/eval/
git commit -m "feat(engine): stub del eval harness de tono (rol C)"
```

---

## Task 6: Backend — package, schemas, settings

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/__init__.py`
- Create: `backend/app/schemas.py`
- Create: `backend/app/settings.py`
- Test: `backend/tests/test_schemas.py`

- [ ] **Step 1: Create `backend/pyproject.toml`**

Create `backend/pyproject.toml`:

```toml
[project]
name = "timon-backend"
version = "0.1.0"
description = "API FastAPI de Timón (API + streaming, sin GPU)"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.30",
    "pydantic>=2",
    "pydantic-settings>=2",
    "sqlalchemy[asyncio]>=2",
    "aiosqlite>=0.20",
    "timon-engine",
]

[project.optional-dependencies]
postgres = ["asyncpg>=0.29"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
```

- [ ] **Step 2: Create package init**

Create `backend/app/__init__.py`:

```python
"""Backend FastAPI de Timón."""
```

- [ ] **Step 3: Write failing test for schemas**

Create `backend/tests/test_schemas.py`:

```python
from app.schemas import ChatRequest, PresetCreate


def test_chat_request_parses_knobs():
    req = ChatRequest(prompt="hola", mode="respuesta", knobs={"formality": 80})
    assert req.knobs.formality == 80
    assert req.knobs.urgency == 50  # default


def test_preset_create_requires_name():
    p = PresetCreate(name="Voz Soporte", knobs={"warmth": 90})
    assert p.name == "Voz Soporte"
    assert p.knobs.warmth == 90
```

- [ ] **Step 4: Run test to verify it fails**

Run: `uv run pytest backend/tests/test_schemas.py -v`
Expected: FAIL (cannot import `app.schemas`).

- [ ] **Step 5: Implement schemas**

Create `backend/app/schemas.py`:

```python
"""Schemas Pydantic de la API. Reutiliza KnobVector del engine."""

from pydantic import BaseModel
from timon_engine.base import Mode
from timon_engine.knobs import KnobVector


class ChatRequest(BaseModel):
    prompt: str
    mode: Mode = "respuesta"
    knobs: KnobVector = KnobVector()
    preset_id: int | None = None


class PresetCreate(BaseModel):
    name: str
    knobs: KnobVector = KnobVector()


class PresetRead(BaseModel):
    id: int
    name: str
    knobs: KnobVector

    model_config = {"from_attributes": True}


class FeatureRead(BaseModel):
    id: int
    name: str
    layer: int
    index: int
    polarity: int  # +1 o -1: dirección del empujón

    model_config = {"from_attributes": True}
```

- [ ] **Step 6: Create settings**

Create `backend/app/settings.py`:

```python
"""Configuración por entorno. El motor se elige con TIMON_ENGINE."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="TIMON_", env_file=".env")

    # "mock" (default, sin GPU) | "gemma" (rol A, requiere GPU)
    engine: str = "mock"
    # SQLite en dev; en prod: postgresql+asyncpg://user:pass@host/db
    database_url: str = "sqlite+aiosqlite:///./timon.db"
    cors_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
```

- [ ] **Step 7: Run test to verify it passes**

Run: `uv run pytest backend/tests/test_schemas.py -v`
Expected: PASS (2 passed).

- [ ] **Step 8: Commit**

```bash
git add backend/pyproject.toml backend/app/__init__.py backend/app/schemas.py backend/app/settings.py backend/tests/test_schemas.py
git commit -m "feat(backend): paquete, schemas y settings"
```

---

## Task 7: Backend — DB models + session

**Files:**
- Create: `backend/app/db.py`
- Create: `backend/app/models.py`
- Test: `backend/tests/test_db.py`

- [ ] **Step 1: Write failing test for the DB layer**

Create `backend/tests/test_db.py`:

```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db import Base
from app.models import Preset


@pytest.fixture
async def session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as s:
        yield s


async def test_create_and_read_preset(session):
    preset = Preset(name="Voz Soporte", knobs={"formality": 80, "warmth": 90})
    session.add(preset)
    await session.commit()
    await session.refresh(preset)
    assert preset.id is not None
    assert preset.knobs["warmth"] == 90
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest backend/tests/test_db.py -v`
Expected: FAIL (cannot import `app.db`).

- [ ] **Step 3: Implement the DB module**

Create `backend/app/db.py`:

```python
"""Motor y sesión async de SQLAlchemy. SQLite (dev) / Postgres (prod)."""

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.settings import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(settings.database_url)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
```

- [ ] **Step 4: Implement the models**

Create `backend/app/models.py`:

```python
"""Modelos ORM: Preset y Feature."""

from sqlalchemy import JSON, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Preset(Base):
    __tablename__ = "presets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True)
    knobs: Mapped[dict] = mapped_column(JSON, default=dict)


class Feature(Base):
    __tablename__ = "features"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    layer: Mapped[int] = mapped_column(Integer)
    index: Mapped[int] = mapped_column(Integer)
    polarity: Mapped[int] = mapped_column(Integer, default=1)
```

- [ ] **Step 5: Run test to verify it passes**

Run: `uv run pytest backend/tests/test_db.py -v`
Expected: PASS (1 passed).

- [ ] **Step 6: Commit**

```bash
git add backend/app/db.py backend/app/models.py backend/tests/test_db.py
git commit -m "feat(backend): modelos ORM + sesión async"
```

---

## Task 8: Backend — engine provider (dependency injection)

**Files:**
- Create: `backend/app/engine_provider.py`
- Test: `backend/tests/test_engine_provider.py`

- [ ] **Step 1: Write failing test**

Create `backend/tests/test_engine_provider.py`:

```python
from timon_engine.mock import MockSteeringEngine

from app.engine_provider import get_engine


def test_get_engine_returns_mock_by_default():
    engine = get_engine()
    assert isinstance(engine, MockSteeringEngine)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `uv run pytest backend/tests/test_engine_provider.py -v`
Expected: FAIL (cannot import `app.engine_provider`).

- [ ] **Step 3: Implement the provider**

Create `backend/app/engine_provider.py`:

```python
"""Selecciona el motor según settings.engine. Inyectado en los endpoints."""

from functools import lru_cache

from timon_engine.base import SteeringEngine
from timon_engine.mock import MockSteeringEngine

from app.settings import settings


@lru_cache
def get_engine() -> SteeringEngine:
    if settings.engine == "gemma":
        # Import diferido: torch/transformers solo si se pide gemma.
        from timon_engine.gemma import GemmaSteeringEngine

        return GemmaSteeringEngine()
    return MockSteeringEngine()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `uv run pytest backend/tests/test_engine_provider.py -v`
Expected: PASS (1 passed).

- [ ] **Step 5: Commit**

```bash
git add backend/app/engine_provider.py backend/tests/test_engine_provider.py
git commit -m "feat(backend): provider de motor (mock/gemma) con import diferido"
```

---

## Task 9: Backend — API routers (chat SSE, presets, features)

**Files:**
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/chat.py`
- Create: `backend/app/api/presets.py`
- Create: `backend/app/api/features.py`
- Test: `backend/tests/test_api.py`

- [ ] **Step 1: Create api package init**

Create `backend/app/api/__init__.py`:

```python
"""Routers de la API."""
```

- [ ] **Step 2: Implement the chat router (SSE)**

Create `backend/app/api/chat.py`:

```python
"""POST /api/chat → respuesta en streaming (SSE) con tono aplicado."""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from timon_engine.base import SteeringEngine

from app.engine_provider import get_engine
from app.schemas import ChatRequest

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat")
async def chat(req: ChatRequest, engine: SteeringEngine = Depends(get_engine)) -> StreamingResponse:
    async def event_stream():
        async for chunk in engine.generate(req.prompt, req.knobs, req.mode):
            # Formato SSE: cada token como un evento "data:".
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

- [ ] **Step 3: Implement the presets router (CRUD)**

Create `backend/app/api/presets.py`:

```python
"""CRUD de presets de voz."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import Preset
from app.schemas import PresetCreate, PresetRead

router = APIRouter(prefix="/api/presets", tags=["presets"])


@router.get("", response_model=list[PresetRead])
async def list_presets(session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(select(Preset))).scalars().all()
    return rows


@router.post("", response_model=PresetRead, status_code=201)
async def create_preset(body: PresetCreate, session: AsyncSession = Depends(get_session)):
    preset = Preset(name=body.name, knobs=body.knobs.model_dump())
    session.add(preset)
    await session.commit()
    await session.refresh(preset)
    return preset


@router.delete("/{preset_id}", status_code=204)
async def delete_preset(preset_id: int, session: AsyncSession = Depends(get_session)):
    preset = await session.get(Preset, preset_id)
    if preset is None:
        raise HTTPException(404, "preset no encontrado")
    await session.delete(preset)
    await session.commit()
```

- [ ] **Step 4: Implement the features router**

Create `backend/app/api/features.py`:

```python
"""GET /api/features → features de GemmaScope para el panel del frontend."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import Feature
from app.schemas import FeatureRead

router = APIRouter(prefix="/api/features", tags=["features"])


@router.get("", response_model=list[FeatureRead])
async def list_features(session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(select(Feature))).scalars().all()
    return rows
```

- [ ] **Step 5: Write the API integration test**

Create `backend/tests/test_api.py`:

```python
import pytest
from httpx import ASGITransport, AsyncClient

from app.db import Base, engine
from app.main import app


@pytest.fixture(autouse=True)
async def _setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


async def test_healthz(client):
    r = await client.get("/healthz")
    assert r.status_code == 200


async def test_chat_streams(client):
    r = await client.post("/api/chat", json={"prompt": "hola", "mode": "respuesta", "knobs": {}})
    assert r.status_code == 200
    assert "data:" in r.text
    assert "[DONE]" in r.text


async def test_presets_crud(client):
    created = await client.post("/api/presets", json={"name": "Voz Soporte", "knobs": {"warmth": 90}})
    assert created.status_code == 201
    pid = created.json()["id"]

    listed = await client.get("/api/presets")
    assert any(p["id"] == pid for p in listed.json())

    deleted = await client.delete(f"/api/presets/{pid}")
    assert deleted.status_code == 204


async def test_features_empty(client):
    r = await client.get("/api/features")
    assert r.status_code == 200
    assert r.json() == []
```

- [ ] **Step 6: Run API tests (will fail — no app yet)**

Run: `uv run pytest backend/tests/test_api.py -v`
Expected: FAIL (cannot import `app.main`). The app is created in Task 10; this test goes green there.

- [ ] **Step 7: Commit**

```bash
git add backend/app/api/ backend/tests/test_api.py
git commit -m "feat(backend): routers chat (SSE), presets (CRUD) y features"
```

---

## Task 10: Backend — main app wiring

**Files:**
- Create: `backend/app/main.py`

- [ ] **Step 1: Implement the FastAPI app**

Create `backend/app/main.py`:

```python
"""App FastAPI de Timón: CORS, lifespan (init DB) y routers."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import chat, features, presets
from app.db import init_db
from app.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Timón API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(presets.router)
app.include_router(features.router)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok", "engine": settings.engine}
```

- [ ] **Step 2: Run the full backend suite**

Run: `uv run pytest backend/tests/ -v`
Expected: PASS (schemas, db, engine_provider, and all api tests green).

- [ ] **Step 3: Smoke-test the server boots**

Run: `uv run uvicorn app.main:app --app-dir backend --port 8000 &` then `sleep 2 && curl -s localhost:8000/healthz && kill %1`
Expected: `{"status":"ok","engine":"mock"}`.

- [ ] **Step 4: Commit**

```bash
git add backend/app/main.py
git commit -m "feat(backend): app FastAPI con CORS, lifespan y routers"
```

---

## Task 11: Backend — Dockerfile + .env example

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/.env.example`
- Create: `backend/.dockerignore`

- [ ] **Step 1: Create the backend Dockerfile**

Create `backend/Dockerfile`:

```dockerfile
# Imagen del API (ligera, sin GPU). El engine real con GPU usa engine/Dockerfile.
FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app

# Copia el workspace (raíz + miembros) para resolver timon-engine.
COPY pyproject.toml uv.lock ./
COPY backend ./backend
COPY engine ./engine

RUN uv sync --frozen --package timon-backend

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Create `.env.example`**

Create `backend/.env.example`:

```bash
# Motor: "mock" (sin GPU) | "gemma" (requiere GPU, rol A)
TIMON_ENGINE=mock
# Dev: SQLite. Prod: postgresql+asyncpg://user:pass@host:5432/timon
TIMON_DATABASE_URL=sqlite+aiosqlite:///./timon.db
TIMON_CORS_ORIGINS=["http://localhost:3000"]
```

- [ ] **Step 3: Create `.dockerignore`**

Create `backend/.dockerignore`:

```
**/__pycache__
**/.venv
**/.pytest_cache
**/*.db
```

- [ ] **Step 4: Commit**

```bash
git add backend/Dockerfile backend/.env.example backend/.dockerignore
git commit -m "chore(backend): Dockerfile + .env.example"
```

---

## Task 12: Engine — GPU Dockerfile stub

**Files:**
- Create: `engine/Dockerfile`

- [ ] **Step 1: Create the engine GPU Dockerfile**

Create `engine/Dockerfile`:

```dockerfile
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
```

- [ ] **Step 2: Commit**

```bash
git add engine/Dockerfile
git commit -m "chore(engine): Dockerfile GPU stub (rol A, L4/RunPod)"
```

---

## Task 13: docker-compose for local dev

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create docker-compose**

Create `docker-compose.yml`:

```yaml
# Dev local: API (mock) + Postgres. El engine GPU se corre aparte (cluster/RunPod).
services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "8000:8000"
    environment:
      TIMON_ENGINE: mock
      TIMON_DATABASE_URL: postgresql+asyncpg://timon:timon@db:5432/timon
      TIMON_CORS_ORIGINS: '["http://localhost:3000"]'
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: timon
      POSTGRES_PASSWORD: timon
      POSTGRES_DB: timon
    ports:
      - "5432:5432"
    volumes:
      - timon_pgdata:/var/lib/postgresql/data

volumes:
  timon_pgdata:
```

- [ ] **Step 2: Validate compose syntax**

Run: `docker compose config -q && echo "compose ok"`
Expected: `compose ok` (no error). If Docker is not installed, skip and note it.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "chore: docker-compose para dev local (API + Postgres)"
```

---

## Task 14: Frontend — Next.js app scaffold

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/next.config.mjs`
- Create: `frontend/.env.local.example`
- Create: `frontend/app/layout.tsx`
- Create: `frontend/app/page.tsx`
- Create: `frontend/app/globals.css`

- [ ] **Step 1: Create `package.json`**

Create `frontend/package.json`:

```json
{
  "name": "timon-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^18",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

Create `frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.mjs`**

Create `frontend/next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

- [ ] **Step 4: Create `.env.local.example`**

Create `frontend/.env.local.example`:

```bash
# URL del backend. Dev: localhost. Prod: el host GPU (cluster/RunPod) por HTTPS.
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 5: Create `globals.css`**

Create `frontend/app/globals.css`:

```css
:root {
  --bg: #0b0e14;
  --fg: #e6e6e6;
  --accent: #4f8cff;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font-family: system-ui, sans-serif; }
```

- [ ] **Step 6: Create root layout**

Create `frontend/app/layout.tsx`:

```tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timón — Consola de voz",
  description: "Mezclador de tono para tu IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Create the home page**

Create `frontend/app/page.tsx`:

```tsx
import { KnobConsole } from "@/components/KnobConsole";
import { ChatStream } from "@/components/ChatStream";
import { PresetManager } from "@/components/PresetManager";
import { FeaturePanel } from "@/components/FeaturePanel";

export default function Home() {
  return (
    <main style={{ display: "grid", gridTemplateColumns: "320px 1fr 280px", gap: 16, padding: 24 }}>
      <section>
        <h1 style={{ fontSize: 20 }}>Timón</h1>
        <KnobConsole />
        <PresetManager />
      </section>
      <section>
        <ChatStream />
      </section>
      <aside>
        <FeaturePanel />
      </aside>
    </main>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add frontend/package.json frontend/tsconfig.json frontend/next.config.mjs frontend/.env.local.example frontend/app/
git commit -m "feat(frontend): scaffold Next.js (layout + página principal)"
```

---

## Task 15: Frontend — API client + component stubs

**Files:**
- Create: `frontend/lib/api.ts`
- Create: `frontend/components/KnobConsole.tsx`
- Create: `frontend/components/ChatStream.tsx`
- Create: `frontend/components/PresetManager.tsx`
- Create: `frontend/components/FeaturePanel.tsx`

- [ ] **Step 1: Create the API client**

Create `frontend/lib/api.ts`:

```ts
// Cliente del backend de Timón. La URL viene de NEXT_PUBLIC_API_URL.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Knobs = { formality: number; urgency: number; warmth: number; detail: number };
export type Mode = "respuesta" | "reescritura";

// POST /api/chat → stream SSE. Llama onToken por cada token recibido.
export async function streamChat(
  prompt: string,
  knobs: Knobs,
  mode: Mode,
  onToken: (t: string) => void,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, knobs, mode }),
  });
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split("\n")) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        onToken(data);
      }
    }
  }
}

export type Preset = { id: number; name: string; knobs: Knobs };

export async function listPresets(): Promise<Preset[]> {
  return (await fetch(`${API_URL}/api/presets`)).json();
}

export type Feature = { id: number; name: string; layer: number; index: number; polarity: number };

export async function listFeatures(): Promise<Feature[]> {
  return (await fetch(`${API_URL}/api/features`)).json();
}
```

- [ ] **Step 2: Create the KnobConsole component**

Create `frontend/components/KnobConsole.tsx`:

```tsx
"use client";
import { useState } from "react";
import type { Knobs } from "@/lib/api";

const NAMES: (keyof Knobs)[] = ["formality", "urgency", "warmth", "detail"];
const LABELS: Record<keyof Knobs, string> = {
  formality: "Formalidad",
  urgency: "Urgencia",
  warmth: "Calidez",
  detail: "Detalle",
};

// Consola de perillas (slide 4). TODO(rol B): elevar el estado y conectarlo al chat.
export function KnobConsole() {
  const [knobs, setKnobs] = useState<Knobs>({ formality: 50, urgency: 50, warmth: 50, detail: 50 });
  return (
    <div>
      <h2 style={{ fontSize: 14, opacity: 0.7 }}>Consola de voz</h2>
      {NAMES.map((name) => (
        <label key={name} style={{ display: "block", marginBottom: 12 }}>
          {LABELS[name]}: {knobs[name]}
          <input
            type="range"
            min={0}
            max={100}
            value={knobs[name]}
            onChange={(e) => setKnobs({ ...knobs, [name]: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </label>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create the ChatStream component**

Create `frontend/components/ChatStream.tsx`:

```tsx
"use client";
import { useState } from "react";
import { streamChat, type Knobs } from "@/lib/api";

// Chat con streaming. TODO(rol B): recibir las perillas reales de KnobConsole.
export function ChatStream() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const knobs: Knobs = { formality: 50, urgency: 50, warmth: 50, detail: 50 };

  async function send() {
    setOutput("");
    await streamChat(prompt, knobs, "respuesta", (t) => setOutput((o) => o + t));
  }

  return (
    <div>
      <h2 style={{ fontSize: 14, opacity: 0.7 }}>Chat</h2>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Escribe un mensaje…"
        style={{ width: "100%", minHeight: 80 }}
      />
      <button onClick={send} style={{ marginTop: 8 }}>Enviar</button>
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>{output}</pre>
    </div>
  );
}
```

- [ ] **Step 4: Create the PresetManager component**

Create `frontend/components/PresetManager.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { listPresets, type Preset } from "@/lib/api";

// Presets de voz (slide 8). TODO(rol B): aplicar/crear/borrar presets.
export function PresetManager() {
  const [presets, setPresets] = useState<Preset[]>([]);
  useEffect(() => {
    listPresets().then(setPresets).catch(() => setPresets([]));
  }, []);
  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 14, opacity: 0.7 }}>Presets</h2>
      {presets.length === 0 ? (
        <p style={{ opacity: 0.5 }}>Sin presets todavía.</p>
      ) : (
        <ul>{presets.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create the FeaturePanel component**

Create `frontend/components/FeaturePanel.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { listFeatures, type Feature } from "@/lib/api";

// Panel de features de GemmaScope (slide 10). TODO(rol B/C): mostrar features curados.
export function FeaturePanel() {
  const [features, setFeatures] = useState<Feature[]>([]);
  useEffect(() => {
    listFeatures().then(setFeatures).catch(() => setFeatures([]));
  }, []);
  return (
    <div>
      <h2 style={{ fontSize: 14, opacity: 0.7 }}>Features</h2>
      {features.length === 0 ? (
        <p style={{ opacity: 0.5 }}>Sin features cargados.</p>
      ) : (
        <ul>{features.map((f) => <li key={f.id}>{f.name} (L{f.layer})</li>)}</ul>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Verify the frontend builds**

Run: `cd frontend && npm install && npm run build && cd ..`
Expected: build succeeds (Next.js compiles all components). If npm is unavailable, note it and skip.

- [ ] **Step 7: Commit**

```bash
git add frontend/lib frontend/components
git commit -m "feat(frontend): cliente API + stubs de componentes (perillas, chat, presets, features)"
```

---

## Task 16: CI — GitHub Actions

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
      - run: uv sync --dev
      - run: uv run ruff check .
      - run: uv run pytest -v

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm install
      - run: npm run build
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: lint + tests Python (uv) y build de frontend"
```

---

## Task 17: docs/ — collaborator onboarding (Spanish)

**Files:**
- Create: `docs/00-overview.md`
- Create: `docs/01-architecture.md`
- Create: `docs/02-getting-started.md`
- Create: `docs/03-deployment.md`
- Create: `docs/04-roles.md`
- Create: `docs/05-glossary.md`

- [ ] **Step 1: Create `docs/00-overview.md`**

Create `docs/00-overview.md`:

```markdown
# Timón — Visión general

Middleware de **tono** para LLMs. Perillas semánticas (Formalidad, Urgencia,
Calidez, Detalle, 0–100) que aplican *activation steering* sobre Gemma 2/3 con
GemmaScope + SAELens. El modelo se empuja por dentro, token por token, en el
forward pass — no se reescribe el prompt ni el texto como bloque.

- **Modo respuesta:** instrucción + perillas → respuesta con ese tono.
- **Modo reescritura:** texto existente → re-tonificado.
- **Presets de voz:** calibrar las perillas una vez y aplicarlas a todo.

Meta: webapp desplegada, steering estable y evaluado (≥80% de aciertos de tono),
demo de atención a cliente en 5 semanas.
```

- [ ] **Step 2: Create `docs/01-architecture.md`**

Create `docs/01-architecture.md`:

```markdown
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
- **API:** `POST /api/chat` (SSE) · `GET/POST/DELETE /api/presets` · `GET /api/features` · `GET /healthz`.
- **DB:** SQLAlchemy async — SQLite (dev) / Postgres (prod). Modelos `Preset`, `Feature`.

El `MockSteeringEngine` permite correr y testear todo **sin GPU**.
```

- [ ] **Step 3: Create `docs/02-getting-started.md`**

Create `docs/02-getting-started.md`:

```markdown
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
```

- [ ] **Step 4: Create `docs/03-deployment.md`**

Create `docs/03-deployment.md`:

```markdown
# Despliegue

**El LLM NO cabe en Vercel** (serverless, sin GPU, límites de tamaño/tiempo).

| Pieza | Dónde | Notas |
|-------|-------|-------|
| Frontend (Next.js) | **Vercel** | `NEXT_PUBLIC_API_URL` apunta al host GPU |
| Backend + engine + Gemma | **Host GPU** | Cluster universidad (L4) o **RunPod** |

## Host GPU: dos opciones
- **Cluster universidad (NVIDIA L4, 24 GB)** — opción de la presentación.
- **RunPod** (pod GPU on-demand: L4 / A10 / A100) — alternativa flexible.

Se despliega con `engine/Dockerfile` (imagen CUDA) y `TIMON_ENGINE=gemma`.

## Sizing del modelo
- Gemma 2 **2B** entra holgado en L4.
- Gemma 2 **9B** entra con cuantización.
- GemmaScope (SAEs) suma memoria — considerar al elegir tamaño.

## Frontend en Vercel
- Root del proyecto: `frontend/`.
- Variable de entorno: `NEXT_PUBLIC_API_URL` = URL pública HTTPS del host GPU.
```

- [ ] **Step 5: Create `docs/04-roles.md`**

Create `docs/04-roles.md`:

```markdown
# Roles y cronograma

| Rol | Persona | Dónde trabaja | Qué entrega |
|-----|---------|---------------|-------------|
| A — Engine/ML | José Manuel Haces | `engine/timon_engine/gemma.py` | Gemma + hooks SAELens, steering estable |
| B — Producto/Frontend | Rafael Juarez | `frontend/` | Perillas, chat, presets, panel features |
| C — Calibración/Eval/Deploy | Pablo Martínez | `engine/eval/`, Docker, CI | Features curados, harness, deploy, demo |

> Reparte los nombres según acuerden; la tabla es la propuesta de la presentación.

## Cronograma (5 semanas)
- **S1** Setup + steering por código
- **S2** API + perillas conectadas
- **S3** Steering estable + features
- **S4** Eval + deploy
- **S5** Demo + documentación
```

- [ ] **Step 6: Create `docs/05-glossary.md`**

Create `docs/05-glossary.md`:

```markdown
# Glosario

- **Steering (activation steering):** empujar las activaciones internas del modelo
  durante la generación para cambiar el comportamiento (aquí, el tono).
- **SAE (Sparse Autoencoder):** red que descompone las activaciones en *features*
  interpretables y dispersos.
- **GemmaScope:** colección de SAEs **pre-entrenados** para Gemma 2/3. Los usamos
  tal cual — no entrenamos SAEs desde cero.
- **SAELens:** librería para cargar SAEs y registrar hooks en el forward pass.
- **Feature:** dirección interpretable dentro del SAE (p. ej. "formalidad"). Cada
  perilla se mapea a uno o varios features.
- **Perilla (knob):** control continuo 0–100 que el usuario mueve (Formalidad,
  Urgencia, Calidez, Detalle).
- **Preset:** conjunto de perillas guardado y nombrado (p. ej. "Voz Soporte").
- **Neuronpedia:** catálogo para explorar/identificar features de GemmaScope.
```

- [ ] **Step 7: Commit**

```bash
git add docs/00-overview.md docs/01-architecture.md docs/02-getting-started.md docs/03-deployment.md docs/04-roles.md docs/05-glossary.md
git commit -m "docs: onboarding del equipo (visión, arquitectura, deploy, roles, glosario)"
```

---

## Task 18: .gitignore — append Claude + project sections

**Files:**
- Modify: `.gitignore` (append at end)

- [ ] **Step 1: Append to `.gitignore`**

Append the following block to the end of `.gitignore` (do NOT overwrite existing content):

```gitignore

# ── Timón ─────────────────────────────────────────────
# Claude / herramientas de IA
.claude/
CLAUDE.local.md
**/.claude/settings.local.json

# Entornos y env
.env
.env.*
!.env.example
!**/.env.example
!**/.env.local.example
frontend/.env.local

# Python / uv
.venv/
__pycache__/
.pytest_cache/
.ruff_cache/
*.db

# Node / Next.js
node_modules/
frontend/.next/
frontend/out/

# Modelos (pesos grandes — nunca al repo)
models/
*.safetensors
*.gguf
*.bin
```

- [ ] **Step 2: Verify ignore works**

Run: `git check-ignore -v .claude/x frontend/.next/y models/z.safetensors 2>/dev/null; echo done`
Expected: each path printed as matched (or just `done` if Docker/git quirks — the key check is they are ignored).

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore Claude, env, venvs, node_modules y pesos de modelo"
```

---

## Task 19: README — Google-style, English, 3 collaborators

**Files:**
- Modify: `README.md` (replace placeholder content)

- [ ] **Step 1: Write the README**

Replace the contents of `README.md` with:

```markdown
# Timón

> A live tone mixer for your AI — control the voice of any language model without rewriting the prompt.

Timón is a tone-steering **middleware** for LLMs. Semantic knobs (Formality,
Urgency, Warmth, Detail) apply **activation steering** to Gemma 2/3 using
pre-trained **GemmaScope** SAEs via **SAELens**. The model is nudged from the
inside, token by token, during the forward pass — not by rewriting the prompt or
post-editing the text.

This is a course project for the **Master's in Artificial Intelligence and Data
Science** at **Universidad Panamericana**.

## Why

Every team uses AI, but everyone writes prompts differently and every model
behaves differently — so a brand's voice is inconsistent. Timón gives a
supervisor a mixing board for tone: move a knob and the response is re-toned
instantly, the same way every time, reusable as a saved preset.

## How it works

```
Input (text + knobs) → Timón (turns knobs into a nudge) → Gemma 2/3 (steered
inside) → Output (exact tone)
```

Timón intercepts the model mid-generation and pushes it toward each knob's
direction, token by token, inside the forward pass. GemmaScope features are
identified and calibrated once; from then on the same setting yields the same
tone.

## Architecture

A `uv` workspace monorepo:

| Component | Stack | Responsibility |
|-----------|-------|----------------|
| `frontend/` | Next.js (Vercel) | Knobs, streaming chat, presets, feature panel |
| `backend/` | FastAPI async | API + SSE streaming; depends only on the engine interface |
| `engine/` | Python + SAELens | Steering engine (Gemma 2/3 + GemmaScope); mock + real |

The backend depends only on the `SteeringEngine` interface. A `MockSteeringEngine`
lets the whole stack run **without a GPU**; `GemmaSteeringEngine` is the real
implementation.

> **Deployment note:** the LLM does **not** fit on Vercel. The frontend deploys to
> Vercel; the backend + engine + model run on a GPU host (university NVIDIA L4
> cluster or RunPod). See [`docs/03-deployment.md`](docs/03-deployment.md).

## Quickstart

```bash
# Backend (mock engine, no GPU)
uv sync
uv run uvicorn app.main:app --app-dir backend --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

Full guide: [`docs/02-getting-started.md`](docs/02-getting-started.md).

## Documentation

- [Overview](docs/00-overview.md)
- [Architecture](docs/01-architecture.md)
- [Getting started](docs/02-getting-started.md)
- [Deployment](docs/03-deployment.md)
- [Roles & timeline](docs/04-roles.md)
- [Glossary](docs/05-glossary.md)

## Authors

- **José Manuel Haces**
- **Rafael Juarez**
- **Pablo Martínez**

Universidad Panamericana — Master's in AI and Data Science.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README estilo Google (inglés) con los 3 colaboradores"
```

---

## Task 20: Final verification

- [ ] **Step 1: Lock and sync the workspace**

Run: `uv sync --dev`
Expected: resolves and installs backend + engine + dev deps; creates `uv.lock`.

- [ ] **Step 2: Lint everything**

Run: `uv run ruff check .`
Expected: no errors (fix any reported, then re-run).

- [ ] **Step 3: Run the full Python test suite**

Run: `uv run pytest -v`
Expected: all tests pass (engine: knobs, mock; backend: schemas, db, engine_provider, api).

- [ ] **Step 4: Boot the API and hit it end-to-end**

Run:
```bash
uv run uvicorn app.main:app --app-dir backend --port 8000 &
sleep 2
curl -s localhost:8000/healthz
curl -s -X POST localhost:8000/api/chat -H 'Content-Type: application/json' -d '{"prompt":"hola","mode":"respuesta","knobs":{"formality":90}}'
kill %1
```
Expected: healthz returns `{"status":"ok","engine":"mock"}`; chat streams `data:` lines mentioning the applied tone and ends with `[DONE]`.

- [ ] **Step 5: Commit the lockfile**

```bash
git add uv.lock
git commit -m "chore: uv.lock del workspace"
```

- [ ] **Step 6: Final sanity — tree**

Run: `git ls-files | sed 's|/.*||' | sort -u`
Expected: top-level entries include `README.md`, `backend`, `docs`, `engine`, `frontend`, `docker-compose.yml`, `pyproject.toml`, `.github`.

---

## Self-Review notes (author)

- **Spec coverage:** frontend/backend/engine split (Tasks 6–15) · engine-as-package (Task 2–5) · mock runs without GPU (Task 3) · SteeringEngine ABC contract (Task 3) · KnobVector 0–100 (Task 2) · SSE chat + presets CRUD + features (Task 9) · DB SQLite/Postgres (Tasks 7, 13) · eval harness (Task 5) · Docker + compose (Tasks 11–13) · CI (Task 16) · docs/ onboarding (Task 17) · .gitignore Claude+misc (Task 18) · README Google-style English w/ 3 authors (Task 19) · Vercel+RunPod deployment documented (Tasks 17, 19). All spec sections mapped.
- **Type consistency:** `KnobVector` fields (`formality/urgency/warmth/detail`) consistent across engine, schemas, frontend `Knobs`, and example dataset. `SteeringEngine.generate(prompt, knobs, mode)` signature consistent in ABC, mock, gemma stub, chat router, and provider. `Mode = Literal["respuesta","reescritura"]` consistent.
- **No placeholders:** every code step contains complete content; stubs that intentionally raise (`GemmaSteeringEngine`, `run_eval`) are explicit, documented `TODO`s for the named role, not plan gaps.
