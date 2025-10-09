from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required
from flask_jwt_extended.exceptions import JWTExtendedException
from flask_migrate import Migrate
from config.config import config
from models.models import db, Crime, User
from routes.routes import api_bp
from services.cache_service import init_cache
from services.swagger_docs import swagger_bp
import os

def create_app(config_name='default'):
    app = Flask(__name__)

    app.config.from_object(config[config_name])

    # Initialize extensions
    CORS(app)
    jwt = JWTManager(app)
    db.init_app(app)
    migrate = Migrate(app, db)

    # JWT error handlers
    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        return jsonify({'error': 'Invalid token', 'message': error_string}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired', 'message': 'Please log in again'}), 401

    @jwt.unauthorized_loader
    def unauthorized_callback(error_string):
        return jsonify({'error': 'Missing authorization header', 'message': error_string}), 401
    
    # Initialize Redis cache
    init_cache(app)

    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(swagger_bp, url_prefix='/api/docs')
    from routes.auth import auth_bp
    app.register_blueprint(auth_bp)

    # Route for displaying all crime data
    @app.route('/data')
    def show_all_data():
        from flask import render_template
        crimes = Crime.query.order_by(Crime.date_time.desc()).all()
        return render_template('data.html', crimes=crimes)

    # Database migrations should be run manually in production:
    # flask db upgrade
    # For development, you can uncomment the following to auto-create tables:
    with app.app_context():
        db.create_all()

    # Create default admin user if no users exist
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
            print("Created default admin user: admin@example.com / admin123")

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_RUN_PORT', 5001))
    app.run(debug=True, host='0.0.0.0', port=port)