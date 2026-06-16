import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db import Base
from app.models import Preset


@pytest.fixture
async def session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with maker() as s:
        yield s


async def test_create_and_read_preset(session):
    preset = Preset(name="Voz Soporte", knobs={"formality": 80, "warmth": 90})
    session.add(preset)
    await session.commit()
    await session.refresh(preset)
    assert preset.id is not None
    assert preset.knobs["warmth"] == 90
