"""Modelos ORM: User, Preset y Feature."""

from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String, default="")
    picture: Mapped[str] = mapped_column(String, default="")
    provider: Mapped[str] = mapped_column(String, default="password")
    hashed_password: Mapped[str] = mapped_column(String, default="")
    role: Mapped[str] = mapped_column(String, default="freemium")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())


class Preset(Base):
    __tablename__ = "presets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    knobs: Mapped[dict] = mapped_column(JSON, default=dict)
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())


class Feature(Base):
    __tablename__ = "features"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    layer: Mapped[int] = mapped_column(Integer)
    index: Mapped[int] = mapped_column(Integer)
    polarity: Mapped[int] = mapped_column(Integer, default=1)
