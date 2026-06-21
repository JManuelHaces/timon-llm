"""CRUD de presets de voz — ligados al usuario autenticado."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db import get_session
from app.models import Preset, User
from app.schemas import PresetCreate, PresetRead, PresetUpdate

FREEMIUM_PRESET_LIMIT = 3

router = APIRouter(prefix="/api/presets", tags=["presets"])


@router.get("", response_model=list[PresetRead])
async def list_presets(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    rows = (
        await session.execute(
            select(Preset)
            .where(Preset.user_id == current_user.id)
            .order_by(Preset.created_at.desc())
        )
    ).scalars().all()
    return rows


@router.post("", response_model=PresetRead, status_code=201)
async def create_preset(
    body: PresetCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "freemium":
        count = (
            await session.execute(
                select(func.count()).select_from(Preset).where(Preset.user_id == current_user.id)
            )
        ).scalar_one()
        if count >= FREEMIUM_PRESET_LIMIT:
            raise HTTPException(
                403,
                f"El plan Freemium permite un máximo de {FREEMIUM_PRESET_LIMIT} rumbos. "
                "Actualiza tu plan para crear más.",
            )

    preset = Preset(name=body.name, knobs=body.knobs.model_dump(), user_id=current_user.id)
    session.add(preset)
    await session.commit()
    await session.refresh(preset)
    return preset


@router.put("/{preset_id}", response_model=PresetRead)
async def update_preset(
    preset_id: int,
    body: PresetUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    preset = await session.get(Preset, preset_id)
    if preset is None or preset.user_id != current_user.id:
        raise HTTPException(404, "preset no encontrado")
    if body.name is not None:
        preset.name = body.name
    if body.knobs is not None:
        preset.knobs = body.knobs.model_dump()
    await session.commit()
    await session.refresh(preset)
    return preset


@router.delete("/{preset_id}", status_code=204)
async def delete_preset(
    preset_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    preset = await session.get(Preset, preset_id)
    if preset is None or preset.user_id != current_user.id:
        raise HTTPException(404, "preset no encontrado")
    await session.delete(preset)
    await session.commit()
