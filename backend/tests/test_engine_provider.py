from timon_engine.mock import MockSteeringEngine

from app.engine_provider import get_engine


def test_get_engine_returns_mock_by_default():
    engine = get_engine()
    assert isinstance(engine, MockSteeringEngine)
