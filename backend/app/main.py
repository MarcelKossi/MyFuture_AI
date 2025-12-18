from __future__ import annotations

from fastapi import FastAPI

from app.api import auth as auth_router
from app.api import public as public_router
from app.api.protected import orientations as orientations_router
from app.api.protected import results as results_router
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title="MyFuture AI API")

    app.include_router(auth_router.router)
    app.include_router(public_router.router)
    app.include_router(orientations_router.router)
    app.include_router(results_router.router)

    @app.get(f"{settings.api_prefix}/health")
    def health() -> dict:
        return {"status": "ok"}

    return app


app = create_app()
