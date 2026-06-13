"""GET /api/features → features de GemmaScope para el panel del frontend."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import Feature
from app.schemas import FeatureRead

router = APIRouter(prefix="/api/features", tags=["features"])


@router.get("", response_model=list[FeatureRead])
async def list_features(session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(select(Feature))).scalars().all()
    return rows
