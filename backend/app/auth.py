"""Core de autenticación: JWT, hashing de contraseñas, verificación Google y dependencia FastAPI."""

from datetime import datetime, timedelta, timezone

import bcrypt
import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models import User
from app.settings import settings

_bearer = HTTPBearer(auto_error=False)

GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"


# ── Contraseñas ──────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ── JWT ──────────────────────────────────────────────────────────────────────

def create_token(user_id: int, email: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido")


# ── Google Identity Services ─────────────────────────────────────────────────

async def verify_google_id_token(credential: str) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(GOOGLE_TOKEN_INFO_URL, params={"id_token": credential})
    if resp.status_code != 200:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "ID token de Google inválido")
    info = resp.json()
    if info.get("aud") != settings.google_client_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Audience del token no coincide con el client_id")
    return {
        "sub": info["sub"],
        "email": info.get("email", ""),
        "name": info.get("name", ""),
        "picture": info.get("picture", ""),
    }


# ── Usuarios ─────────────────────────────────────────────────────────────────

async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_or_create_google_user(
    session: AsyncSession, email: str, name: str, picture: str,
) -> User:
    user = await get_user_by_email(session, email)
    if user:
        user.name = name or user.name
        user.picture = picture or user.picture
        await session.commit()
        return user
    user = User(email=email, name=name, picture=picture, provider="google")
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    session: AsyncSession = Depends(get_session),
) -> User:
    if not creds:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No autenticado")
    payload = decode_token(creds.credentials)
    result = await session.execute(select(User).where(User.id == int(payload["sub"])))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario no encontrado")
    return user
