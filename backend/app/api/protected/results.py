from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.dependencies.auth import get_verified_user
from app.db.session import get_db
from app.models.result import Result
from app.models.user import User
from app.schemas.result import ResultCreate, ResultRead

router = APIRouter(prefix=f"{settings.api_prefix}/results", tags=["results"])


@router.post("", response_model=ResultRead)
def create_result(
    payload: ResultCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
) -> ResultRead:
    result = Result(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        orientation_id=payload.orientation_id,
        payload_json=payload.payload_json,
    )
    db.add(result)
    db.commit()
    db.refresh(result)

    return ResultRead(
        id=result.id,
        user_id=result.user_id,
        orientation_id=result.orientation_id,
        payload_json=result.payload_json,
        created_at=result.created_at,
    )


@router.get("/me", response_model=list[ResultRead])
def list_my_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
) -> list[ResultRead]:
    items = db.scalars(select(Result).where(Result.user_id == current_user.id).order_by(Result.created_at.desc())).all()
    return [
        ResultRead(
            id=r.id,
            user_id=r.user_id,
            orientation_id=r.orientation_id,
            payload_json=r.payload_json,
            created_at=r.created_at,
        )
        for r in items
    ]
