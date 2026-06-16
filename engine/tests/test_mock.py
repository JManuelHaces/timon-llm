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
