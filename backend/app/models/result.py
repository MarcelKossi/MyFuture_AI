from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Result(Base):
    __tablename__ = "results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # Sensitive user-scoped data: always query/filter by user_id.
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)

    # Optional linkage to the orientation that produced this result.
    orientation_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)

    # Store payload as JSON string to remain portable and simple for MVP.
    payload_json: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
