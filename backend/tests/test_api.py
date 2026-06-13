import pytest
from httpx import ASGITransport, AsyncClient

from app.db import Base, engine
from app.main import app


@pytest.fixture(autouse=True)
async def _setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


async def test_healthz(client):
    r = await client.get("/healthz")
    assert r.status_code == 200


async def test_chat_streams(client):
    r = await client.post("/api/chat", json={"prompt": "hola", "mode": "respuesta", "knobs": {}})
    assert r.status_code == 200
    assert "data:" in r.text
    assert "[DONE]" in r.text


async def test_presets_crud(client):
    created = await client.post("/api/presets", json={"name": "Voz Soporte", "knobs": {"warmth": 90}})
    assert created.status_code == 201
    pid = created.json()["id"]

    listed = await client.get("/api/presets")
    assert any(p["id"] == pid for p in listed.json())

    deleted = await client.delete(f"/api/presets/{pid}")
    assert deleted.status_code == 204


async def test_features_empty(client):
    r = await client.get("/api/features")
    assert r.status_code == 200
    assert r.json() == []
