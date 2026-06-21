"""Schemas Pydantic de la API. Reutiliza KnobVector del engine."""

from datetime import datetime

from pydantic import BaseModel, EmailStr

from timon_engine.base import Mode
from timon_engine.knobs import KnobVector


# ── Auth ──


class GoogleAuthRequest(BaseModel):
    credential: str


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserRead"


class UserRead(BaseModel):
    id: int
    email: str
    name: str
    picture: str
    provider: str
    role: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str | None = None
    picture: str | None = None


class ChatRequest(BaseModel):
    prompt: str
    mode: Mode = "respuesta"
    knobs: KnobVector = KnobVector()
    preset_id: int | None = None


class PresetCreate(BaseModel):
    name: str
    knobs: KnobVector = KnobVector()


class PresetUpdate(BaseModel):
    name: str | None = None
    knobs: KnobVector | None = None


class PresetRead(BaseModel):
    id: int
    name: str
    knobs: KnobVector
    user_id: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class FeatureRead(BaseModel):
    id: int
    name: str
    layer: int
    index: int
    polarity: int  # +1 o -1: dirección del empujón

    model_config = {"from_attributes": True}
