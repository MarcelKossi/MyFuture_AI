from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserRead(BaseModel):
    id: str
    email: EmailStr
    auth_provider: str
    created_at: datetime | None = None


class UserMe(UserRead):
    pass
