from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth as auth_router
from app.api import public as public_router
from app.api.protected import orientations as orientations_router
from app.api.protected import results as results_router
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(title="MyFuture AI API")

    allow_origins = [o.strip() for o in (settings.cors_allow_origins or "").split(",") if o.strip()]
    if allow_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=allow_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(auth_router.router)
    app.include_router(public_router.router)
    app.include_router(orientations_router.router)
    app.include_router(results_router.router)

    @app.get("/")
    def root() -> dict:
        return {
            "status": "ok",
            "health": f"{settings.api_prefix}/health",
            "docs": "/docs",
            "openapi": "/openapi.json",
        }

    @app.get(f"{settings.api_prefix}/health")
    def health() -> dict:
        return {"status": "ok"}

    return app


app = create_app()
