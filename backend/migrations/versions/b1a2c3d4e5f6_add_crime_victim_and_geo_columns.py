"""Add victim/occurrence detail columns and geocoded flag to crimes table

Promotes BO / delegacia / sexo / idade / coorpin / regiao / id_municipio out of
the free-text `description` field into queryable columns, adds `aisp_name` for
non-numbered (interior) AISP regions, and a `geocoded` flag to distinguish real
points from pending-georeferencing placeholders.

Revision ID: b1a2c3d4e5f6
Revises: add_user_activity_logs_table
Create Date: 2026-09-02 15:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b1a2c3d4e5f6'
down_revision = 'add_user_activity_logs_table'
branch_labels = None
depends_on = None


NEW_COLUMNS = [
    ('bo', sa.String(length=50)),
    ('delegacia', sa.String(length=200)),
    ('sexo', sa.String(length=20)),
    ('idade', sa.Integer()),
    ('coorpin', sa.String(length=120)),
    ('regiao', sa.String(length=50)),
    ('id_municipio', sa.String(length=20)),
    ('geocoded', sa.Boolean()),
    ('aisp_name', sa.String(length=100)),
]

NEW_INDEXES = [
    ('idx_crimes_aisp_name', ['aisp_name']),
    ('idx_crimes_bo', ['bo']),
    ('idx_crimes_sexo', ['sexo']),
    ('idx_crimes_regiao', ['regiao']),
    ('idx_crimes_bo_type_date', ['bo', 'crime_type', 'date_time']),
]


def _existing_columns(conn):
    context = op.get_context()
    if context.dialect.name == 'sqlite':
        rows = conn.execute(sa.text("PRAGMA table_info(crimes)")).fetchall()
        return {row[1] for row in rows}
    rows = conn.execute(sa.text(
        "SELECT column_name FROM information_schema.columns WHERE table_name='crimes'"
    )).fetchall()
    return {row[0] for row in rows}


def _existing_indexes(conn):
    context = op.get_context()
    if context.dialect.name == 'sqlite':
        rows = conn.execute(sa.text("PRAGMA index_list(crimes)")).fetchall()
        return {row[1] for row in rows}
    rows = conn.execute(sa.text(
        "SELECT indexname FROM pg_indexes WHERE tablename='crimes'"
    )).fetchall()
    return {row[0] for row in rows}


def upgrade():
    conn = op.get_bind()
    columns = _existing_columns(conn)

    to_add = [(name, col_type) for name, col_type in NEW_COLUMNS if name not in columns]
    if to_add:
        with op.batch_alter_table('crimes', schema=None) as batch_op:
            for name, col_type in to_add:
                batch_op.add_column(sa.Column(name, col_type, nullable=True))

    # Default existing rows to geocoded=True (previous behaviour assumed points were real)
    if any(name == 'geocoded' for name, _ in to_add):
        op.execute("UPDATE crimes SET geocoded = TRUE WHERE geocoded IS NULL")

    indexes = _existing_indexes(conn)
    for index_name, cols in NEW_INDEXES:
        if index_name not in indexes:
            op.create_index(index_name, 'crimes', cols, unique=False)


def downgrade():
    conn = op.get_bind()
    indexes = _existing_indexes(conn)
    for index_name, _cols in NEW_INDEXES:
        if index_name in indexes:
            op.drop_index(index_name, table_name='crimes')

    columns = _existing_columns(conn)
    to_drop = [name for name, _ in NEW_COLUMNS if name in columns]
    if to_drop:
        with op.batch_alter_table('crimes', schema=None) as batch_op:
            for name in to_drop:
                batch_op.drop_column(name)
