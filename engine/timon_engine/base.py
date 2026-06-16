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
