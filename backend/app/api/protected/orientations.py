from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.dependencies.auth import get_verified_user
from app.models.orientation import Orientation
from app.models.user import User
from app.schemas.orientation import OrientationCreate, OrientationRead

router = APIRouter(prefix=f"{settings.api_prefix}/orientations", tags=["orientations"])


@router.post("", response_model=OrientationRead)
def create_orientation(
    payload: OrientationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
) -> OrientationRead:
    orientation = Orientation(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        level=payload.level,
        input_method=payload.input_method,
    )
    db.add(orientation)
    db.commit()
    db.refresh(orientation)

    return OrientationRead(
        id=orientation.id,
        user_id=orientation.user_id,
        level=orientation.level,
        input_method=orientation.input_method,
        created_at=orientation.created_at,
    )


@router.get("/me", response_model=list[OrientationRead])
def list_my_orientations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
) -> list[OrientationRead]:
    items = db.scalars(
        select(Orientation).where(Orientation.user_id == current_user.id).order_by(Orientation.created_at.desc())
    ).all()

    return [
        OrientationRead(
            id=o.id,
            user_id=o.user_id,
            level=o.level,
            input_method=o.input_method,
            created_at=o.created_at,
        )
        for o in items
    ]
