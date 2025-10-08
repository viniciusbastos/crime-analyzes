from app import create_app
from models.models import db, User

def create_default_user():
    app = create_app()
    with app.app_context():
        # Check if user already exists
        existing_user = User.query.filter_by(email='admin@example.com').first()
        if existing_user:
            print("Default user already exists")
            return

        # Create default user
        user = User(email='admin@example.com', name='Admin User', role='admin')
        user.set_password('password123')
        db.session.add(user)
        db.session.commit()
        print("Default user created: admin@example.com / password123")

if __name__ == '__main__':
    create_default_user()