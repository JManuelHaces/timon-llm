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
