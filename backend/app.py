from flask import Flask, jsonify
from flask_cors import CORS
from flask_compress import Compress
from flask_jwt_extended import JWTManager, jwt_required
from flask_jwt_extended.exceptions import JWTExtendedException
from flask_migrate import Migrate
from config.config import config
from models.models import db, Crime, User
from routes.routes import api_bp
from services.cache_service import init_cache
from services.swagger_docs import swagger_bp
import os
import logging

def create_app(config_name='default'):
    # Configure logging before creating the app
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler()
        ]
    )
    # Disable werkzeug access logs in production
    if config_name != 'development':
        logging.getLogger('werkzeug').setLevel(logging.WARNING)

    app = Flask(__name__)

    app.config.from_object(config[config_name])

    # Initialize extensions
    CORS(app)
    Compress(app)  # Gzip compress API responses (~70-90% smaller JSON payloads)
    jwt = JWTManager(app)
    db.init_app(app)
    migrate = Migrate(app, db)

    # Diagnostic logging for database connection
    with app.app_context():
        try:
            # Test basic connection using SQLAlchemy 2.0+ syntax
            with db.engine.connect() as connection:
                connection.execute(db.text('SELECT 1'))
                app.logger.info("Database connection successful")

                # Check if PostGIS is available (required for Geometry columns)
                result = connection.execute(db.text("SELECT PostGIS_version()")).fetchone()
                if result:
                    app.logger.info(f"PostGIS available: {result[0]}")
                else:
                    app.logger.warning("PostGIS not available - spatial queries may fail")

            # Check current database URI (for debugging config issues)
            app.logger.info(f"Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")

        except Exception as e:
            app.logger.error(f"Database connection failed: {e}")
            # Don't fail app startup, but log the error

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

    # Database migrations are run in start.sh via 'flask db upgrade'
    # No need to call db.create_all() here as it can cause issues with existing indexes

    # Create default admin user if no users exist
    try:
        with app.app_context():
            app.logger.info("Checking for existing users...")
            existing_user = User.query.first()
            if not existing_user:
                app.logger.info("No users found, creating default admin user...")
                default_user = User(
                    email='admin@example.com',
                    name='Admin User',
                    role='admin',
                    unidade='6ª CIPM - Rio Real'
                )
                default_user.set_password('admin123')
                db.session.add(default_user)
                db.session.commit()
                app.logger.info("Default admin user created: admin@example.com / admin123")
            else:
                app.logger.info(f"Existing user found: {existing_user.email}")
    except Exception as e:
        # Log the error but don't fail the app startup
        app.logger.error(f"Error creating default user: {e}")
        import traceback
        app.logger.error(f"User creation traceback: {traceback.format_exc()}")

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_RUN_PORT', 5001))
    app.run(debug=True, host='0.0.0.0', port=port)