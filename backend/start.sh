#!/bin/bash

# Ensure we're in the correct directory
cd /app || exit 1

# Set Python path to include current directory
export PYTHONPATH=/app:$PYTHONPATH

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run database migrations
echo "Running database migrations..."
FLASK_APP=app FLASK_ENV=production python3 -m flask db upgrade

# Create default admin user if it doesn't exist
echo "Checking for default admin user..."
python3 -c "
import sys
sys.path.insert(0, '/app')
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

# Load sample data if database is empty
echo "Checking if sample data needs to be loaded..."
python3 -c "
import sys
sys.path.insert(0, '/app')
from app import create_app
from models.models import Crime, db

app = create_app()
with app.app_context():
    if not Crime.query.first():
        print('EMPTY')
    else:
        print('EXISTS')
" | grep -q "EMPTY"

if [ $? -eq 0 ]; then
    echo "Converting crime data..."
    python3 convert_crime_data.py
    echo "Loading converted crime data..."
    python3 load_converted_data.py
else
    echo "Sample data already exists, skipping load"
fi

# Start the application
echo "Starting application..."
exec gunicorn --workers 4 --bind 0.0.0.0:5000 --log-level info --access-logfile - --pythonpath /app --chdir /app wsgi:application