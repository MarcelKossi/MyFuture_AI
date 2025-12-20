"""SQLAlchemy models package.

Import all model modules here so Alembic can load Base.metadata in one place.
"""

from app.models.user import User  # noqa: F401
from app.models.orientation import Orientation  # noqa: F401
from app.models.result import Result  # noqa: F401
