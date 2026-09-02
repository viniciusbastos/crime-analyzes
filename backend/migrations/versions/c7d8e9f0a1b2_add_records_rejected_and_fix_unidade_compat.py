"""Add records_rejected to upload_logs; fix unidade column cross-db compat

Adds the ``records_rejected`` counter to ``upload_logs`` so every upload
response can report exactly how many rows were dropped and why.

Also re-applies the sqlite/postgres compatibility fix for the ``unidade``
column that was previously made by editing the already-applied migration
``f2bc473c8eee``.  Doing it here as a new migration avoids revision drift.

Revision ID: c7d8e9f0a1b2
Revises: b1a2c3d4e5f6
Create Date: 2026-09-02 15:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c7d8e9f0a1b2'
down_revision = 'b1a2c3d4e5f6'
branch_labels = None
depends_on = None


def _existing_columns(conn, table):
    context = op.get_context()
    if context.dialect.name == 'sqlite':
        rows = conn.execute(sa.text(f"PRAGMA table_info({table})")).fetchall()
        return {row[1] for row in rows}
    rows = conn.execute(sa.text(
        f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}'"
    )).fetchall()
    return {row[0] for row in rows}


def _existing_indexes(conn):
    context = op.get_context()
    if context.dialect.name == 'sqlite':
        rows = conn.execute(sa.text("PRAGMA index_list(users)")).fetchall()
        return {row[1] for row in rows}
    rows = conn.execute(sa.text(
        "SELECT indexname FROM pg_indexes WHERE tablename='users'"
    )).fetchall()
    return {row[0] for row in rows}


def upgrade():
    conn = op.get_bind()

    # 1. Add records_rejected to upload_logs
    upload_cols = _existing_columns(conn, 'upload_logs')
    if 'records_rejected' not in upload_cols:
        with op.batch_alter_table('upload_logs', schema=None) as batch_op:
            batch_op.add_column(
                sa.Column('records_rejected', sa.Integer(), nullable=True, server_default='0')
            )

    # 2. Ensure idx_users_unidade exists (cross-db compatible, replaces the
    #    edit made to f2bc473c8eee which cannot be modified safely).
    indexes = _existing_indexes(conn)
    if 'idx_users_unidade' not in indexes:
        op.create_index('idx_users_unidade', 'users', ['unidade'], unique=False)


def downgrade():
    conn = op.get_bind()
    upload_cols = _existing_columns(conn, 'upload_logs')
    if 'records_rejected' in upload_cols:
        with op.batch_alter_table('upload_logs', schema=None) as batch_op:
            batch_op.drop_column('records_rejected')
