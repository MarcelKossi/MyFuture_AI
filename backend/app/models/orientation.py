from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Orientation(Base):
    __tablename__ = "orientations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # Sensitive user-scoped data: always query/filter by user_id.
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)

    # Minimal fields for MVP; keep DB-agnostic.
    level: Mapped[str] = mapped_column(String(32), nullable=False)
    input_method: Mapped[str] = mapped_column(String(32), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
