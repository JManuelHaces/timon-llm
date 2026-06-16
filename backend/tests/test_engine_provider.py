from app.engine_provider import get_engine
from timon_engine.mock import MockSteeringEngine


def test_get_engine_returns_mock_by_default():
    engine = get_engine()
    assert isinstance(engine, MockSteeringEngine)
