from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ResultCreate(BaseModel):
    orientation_id: str | None = None
    payload_json: str = Field(min_length=2)


class ResultRead(BaseModel):
    id: str
    user_id: str
    orientation_id: str | None = None
    payload_json: str
    created_at: datetime | None = None
