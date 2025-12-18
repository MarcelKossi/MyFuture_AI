from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class OrientationCreate(BaseModel):
    level: str = Field(min_length=1, max_length=32)
    input_method: str = Field(min_length=1, max_length=32)


class OrientationRead(BaseModel):
    id: str
    user_id: str
    level: str
    input_method: str
    created_at: datetime | None = None
