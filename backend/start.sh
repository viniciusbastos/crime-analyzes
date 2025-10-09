#!/bin/bash

# Wait for database to be ready (if using external database)
# This is optional and depends on your setup

# Run database migrations
echo "Running database migrations..."
flask db upgrade

# Create default admin user if it doesn't exist
echo "Checking for default admin user..."
python3 -c "
from app import create_app
from models.models import User, db

app = create_app()
with app.app_context():
    if not User.query.first():
        default_user = User(
            email='admin@example.com',
            name='Admin User',
            role='admin'
        )
        default_user.set_password('admin123')
        db.session.add(default_user)
        db.session.commit()
        print('Created default admin user: admin@example.com / admin123')
    else:
        print('Default admin user already exists')
"

# Start the application
echo "Starting application..."
exec gunicorn --workers 4 --bind 0.0.0.0:5000 app:app