from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config.config import config
from models.models import db, Crime
from routes.routes import api_bp
from services.cache_service import init_cache
from services.swagger_docs import swagger_bp
import os

def create_app(config_name='default'):
    app = Flask(__name__,
                static_folder=os.path.join(os.path.dirname(__file__), 'frontend', 'dist'),
                static_url_path='')

    app.config.from_object(config[config_name])

    # Initialize extensions
    CORS(app)
    JWTManager(app)
    db.init_app(app)
    
    # Initialize Redis cache
    init_cache(app)

    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(swagger_bp, url_prefix='/api/docs')

    # Route for displaying all crime data
    @app.route('/data')
    def show_all_data():
        from flask import render_template
        crimes = Crime.query.order_by(Crime.date_time.desc()).all()
        return render_template('data.html', crimes=crimes)

    # Serve React App
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react_app(path):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, 'index.html')

    # Create database tables
    with app.app_context():
        db.create_all()

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_RUN_PORT', 5001))
    app.run(debug=True, port=port)