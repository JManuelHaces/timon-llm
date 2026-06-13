"""Modelos ORM: Preset y Feature."""

from sqlalchemy import JSON, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Preset(Base):
    __tablename__ = "presets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True)
    knobs: Mapped[dict] = mapped_column(JSON, default=dict)


class Feature(Base):
    __tablename__ = "features"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    layer: Mapped[int] = mapped_column(Integer)
    index: Mapped[int] = mapped_column(Integer)
    polarity: Mapped[int] = mapped_column(Integer, default=1)
