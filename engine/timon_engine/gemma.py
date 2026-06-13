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
