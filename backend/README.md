# Backend (FastAPI)

Minimal FastAPI backend for MyFuture AI.

## Goals

- Runs fully locally with a **SQLite file DB** (`sqlite:///./myfuture.db` by default)
- Designed to be **PostgreSQL-ready** (swap `MYFUTURE_DATABASE_URL` later)
- Uses **SQLAlchemy ORM** + **Alembic migrations**

## Structure

- `app/main.py`: FastAPI entrypoint
- `app/core/`: settings & security helpers
- `app/db/`: SQLAlchemy Base + session dependency
- `app/models/`: ORM models (User/Orientation/Result)
- `app/schemas/`: Pydantic schemas
- `alembic/` + `alembic.ini`: migrations

## Local development

1) Install dependencies

- `pip install -e .` (or install via your preferred workflow)

2) Run migrations

- `alembic upgrade head`

3) Start the API

- `uvicorn app.main:app --reload --port 8000`

## Environment variables

- `MYFUTURE_DATABASE_URL` (default: `sqlite:///./myfuture.db`)
- `MYFUTURE_JWT_SECRET_KEY` (default: `CHANGE_ME`)
