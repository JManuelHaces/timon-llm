"""CRUD de presets de voz."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import Preset
from app.schemas import PresetCreate, PresetRead

router = APIRouter(prefix="/api/presets", tags=["presets"])


@router.get("", response_model=list[PresetRead])
async def list_presets(session: AsyncSession = Depends(get_session)):
    rows = (await session.execute(select(Preset))).scalars().all()
    return rows


@router.post("", response_model=PresetRead, status_code=201)
async def create_preset(body: PresetCreate, session: AsyncSession = Depends(get_session)):
    preset = Preset(name=body.name, knobs=body.knobs.model_dump())
    session.add(preset)
    await session.commit()
    await session.refresh(preset)
    return preset


@router.put("/{preset_id}", response_model=PresetRead)
async def update_preset(
    preset_id: int, body: PresetCreate, session: AsyncSession = Depends(get_session)
):
    preset = await session.get(Preset, preset_id)
    if preset is None:
        raise HTTPException(404, "preset no encontrado")
    preset.name = body.name
    preset.knobs = body.knobs.model_dump()
    await session.commit()
    await session.refresh(preset)
    return preset


@router.delete("/{preset_id}", status_code=204)
async def delete_preset(preset_id: int, session: AsyncSession = Depends(get_session)):
    preset = await session.get(Preset, preset_id)
    if preset is None:
        raise HTTPException(404, "preset no encontrado")
    await session.delete(preset)
    await session.commit()
