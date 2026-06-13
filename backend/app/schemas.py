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
