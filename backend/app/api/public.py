from __future__ import annotations

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(prefix=f"{settings.api_prefix}/public", tags=["public"])


@router.get("/careers")
def list_careers() -> dict:
    # Public, non-personal endpoint: no auth, no DB writes.
    return {"items": ["Software Engineer", "Data Analyst", "Nurse", "Teacher"]}


@router.get("/fields")
def list_fields() -> dict:
    return {"items": ["Computer Science", "Health", "Education", "Business"]}


@router.get("/trends")
def list_trends() -> dict:
    return {"items": ["AI", "Cybersecurity", "Green jobs"]}
