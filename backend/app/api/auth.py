"""Endpoints de autenticación: Google SSO, registro y login con contraseña real."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    create_token,
    get_current_user,
    get_or_create_google_user,
    get_user_by_email,
    hash_password,
    verify_google_id_token,
    verify_password,
)
from app.db import get_session
from app.models import User
from app.schemas import AuthResponse, GoogleAuthRequest, LoginRequest, RegisterRequest, UserRead, UserUpdate

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/google", response_model=AuthResponse)
async def auth_google(body: GoogleAuthRequest, session: AsyncSession = Depends(get_session)):
    """Verifica el ID token de Google y devuelve un JWT de Timón.
    Crea el usuario automáticamente si es la primera vez.
    """
    claims = await verify_google_id_token(body.credential)
    user = await get_or_create_google_user(
        session,
        email=claims["email"],
        name=claims["name"],
        picture=claims["picture"],
    )
    return AuthResponse(access_token=create_token(user.id, user.email), user=UserRead.model_validate(user))


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def auth_register(body: RegisterRequest, session: AsyncSession = Depends(get_session)):
    """Registra un usuario nuevo con email y contraseña.
    Si el email ya existe retorna 409.
    """
    if not body.name.strip() or not body.email.strip() or not body.password.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Nombre, email y contraseña son obligatorios")
    existing = await get_user_by_email(session, body.email.strip().lower())
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe una cuenta con ese email")
    if len(body.password) < 6:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "La contraseña debe tener al menos 6 caracteres")

    user = User(
        email=body.email.strip().lower(),
        name=body.name.strip(),
        hashed_password=hash_password(body.password),
        provider="password",
        role="freemium",
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return AuthResponse(access_token=create_token(user.id, user.email), user=UserRead.model_validate(user))


@router.post("/login", response_model=AuthResponse)
async def auth_login(body: LoginRequest, session: AsyncSession = Depends(get_session)):
    """Login con email y contraseña. Verifica contra la base de datos."""
    if not body.email.strip() or not body.password.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Email y contraseña requeridos")

    user = await get_user_by_email(session, body.email.strip().lower())
    if not user or user.provider != "password":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email o contraseña incorrectos")
    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email o contraseña incorrectos")

    return AuthResponse(access_token=create_token(user.id, user.email), user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
async def auth_me(user: User = Depends(get_current_user)):
    return UserRead.model_validate(user)


@router.patch("/me", response_model=UserRead)
async def update_me(
    body: UserUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Actualiza nombre o avatar del usuario autenticado."""
    if body.name is not None:
        user.name = body.name.strip()
    if body.picture is not None:
        user.picture = body.picture.strip()
    await session.commit()
    await session.refresh(user)
    return UserRead.model_validate(user)
