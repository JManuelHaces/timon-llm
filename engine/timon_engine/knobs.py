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
