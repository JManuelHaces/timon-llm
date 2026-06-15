"""Selecciona el motor según settings.engine. Inyectado en los endpoints."""

from functools import lru_cache

from app.settings import settings
from timon_engine.base import SteeringEngine
from timon_engine.mock import MockSteeringEngine


@lru_cache
def get_engine() -> SteeringEngine:
    if settings.engine == "gemma":
        # Import diferido: torch/transformers solo si se pide gemma.
        from timon_engine.gemma import GemmaSteeringEngine

        return GemmaSteeringEngine()
    return MockSteeringEngine()
