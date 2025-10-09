# Database Migrations

This project uses Flask-Migrate (Alembic) for database schema migrations.

## Setup

Flask-Migrate has been initialized and the initial baseline migration has been created.

## Commands

### Initialize migrations (already done)
```bash
flask db init
```

### Create a new migration
```bash
flask db migrate -m "Description of changes"
```

### Apply migrations
```bash
flask db upgrade
```

### Rollback migrations
```bash
flask db downgrade
```

### Check current migration status
```bash
flask db current
```

### Show migration history
```bash
flask db history
```

## Production Deployment

For production deployments:

1. Run migrations before starting the application:
   ```bash
   flask db upgrade
   ```

2. Never run `db.create_all()` in production - use migrations instead.

## Docker Deployment

When using Docker/docker-compose, migrations are automatically run during container startup via the `start.sh` script. The script:

1. Runs `flask db upgrade` to apply any pending migrations
2. Creates the default admin user if it doesn't exist
3. Starts the Gunicorn server

Make sure `FLASK_APP=app.py` is set in your environment variables.

## Development

In development, you can use `db.create_all()` for quick setup, but for schema changes, always create proper migrations.

## Configuration

Migrations are configured in `alembic.ini`. The database URI is taken from the Flask app configuration.