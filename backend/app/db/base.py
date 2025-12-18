from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import models so that Alembic autogenerate can discover them via Base.metadata.
# Keep this at the bottom to avoid circular import issues.
from app.models.user import User  # noqa: E402,F401

try:  # These modules may not exist at very early bootstrap stages.
    from app.models.orientation import Orientation  # noqa: E402,F401
    from app.models.result import Result  # noqa: E402,F401
except ModuleNotFoundError:
    pass
