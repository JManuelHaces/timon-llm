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
