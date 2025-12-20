"""initial schema (users/orientations/results)

Revision ID: 20251218_0001
Revises:
Create Date: 2025-12-18

This migration was originally created to add a username column, but on a fresh
database there were no tables to alter. It now creates the initial schema when
tables are missing, while remaining compatible with environments where tables
may already exist (e.g., created via SQLAlchemy metadata during early dev).
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20251218_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = set(inspector.get_table_names())

    if "users" not in existing_tables:
        op.create_table(
            "users",
            sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
            sa.Column("username", sa.String(length=30), nullable=True),
            sa.Column("email", sa.String(length=320), nullable=False),
            sa.Column("password_hash", sa.String(length=255), nullable=True),
            sa.Column("auth_provider", sa.String(length=32), nullable=False, server_default="password"),
            sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("email_verification_token_hash", sa.String(length=128), nullable=True),
            sa.Column("email_verification_expires_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("password_reset_token_hash", sa.String(length=128), nullable=True),
            sa.Column("password_reset_expires_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("password_reset_requested_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            sa.UniqueConstraint("email", name="uq_users_email"),
            sa.UniqueConstraint("username", name="uq_users_username"),
        )

        op.create_index("ix_users_email", "users", ["email"], unique=True)
        op.create_index("ix_users_username", "users", ["username"], unique=True)
        op.create_index("ix_users_email_verification_token_hash", "users", ["email_verification_token_hash"], unique=False)
        op.create_index("ix_users_password_reset_token_hash", "users", ["password_reset_token_hash"], unique=False)
    else:
        existing_columns = {col["name"] for col in inspector.get_columns("users")}
        if "username" not in existing_columns:
            op.add_column("users", sa.Column("username", sa.String(length=30), nullable=True))

        existing_indexes = {idx["name"] for idx in inspector.get_indexes("users")}
        if "ix_users_username" not in existing_indexes:
            op.create_index("ix_users_username", "users", ["username"], unique=True)

    if "orientations" not in existing_tables:
        op.create_table(
            "orientations",
            sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
            sa.Column("user_id", sa.String(length=36), nullable=False),
            sa.Column("level", sa.String(length=32), nullable=False),
            sa.Column("input_method", sa.String(length=32), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
        )
        op.create_index("ix_orientations_user_id", "orientations", ["user_id"], unique=False)

    if "results" not in existing_tables:
        op.create_table(
            "results",
            sa.Column("id", sa.String(length=36), primary_key=True, nullable=False),
            sa.Column("user_id", sa.String(length=36), nullable=False),
            sa.Column("orientation_id", sa.String(length=36), nullable=True),
            sa.Column("payload_json", sa.String(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index("ix_results_user_id", "results", ["user_id"], unique=False)
        op.create_index("ix_results_orientation_id", "results", ["orientation_id"], unique=False)


def downgrade() -> None:
    # Best-effort reverse for local/dev.
    op.drop_index("ix_results_orientation_id", table_name="results")
    op.drop_index("ix_results_user_id", table_name="results")
    op.drop_table("results")

    op.drop_index("ix_orientations_user_id", table_name="orientations")
    op.drop_table("orientations")

    op.drop_index("ix_users_password_reset_token_hash", table_name="users")
    op.drop_index("ix_users_email_verification_token_hash", table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
