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
