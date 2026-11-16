import importlib.util
import os
from dotenv import load_dotenv

load_dotenv()

# Absolute path to backend/data, independent of the process working directory.
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.getenv('DATA_DIR', os.path.join(BACKEND_DIR, 'data'))


def normalize_database_url(url: str | None) -> str | None:
    """Normalize legacy or missing-driver PostgreSQL URLs for SQLAlchemy."""
    if url is None:
        return None
    if url.startswith('postgres://'):
        url = url.replace('postgres://', 'postgresql://', 1)
    if url.startswith('postgresql+psycopg://') and importlib.util.find_spec('psycopg') is None:
        url = url.replace('postgresql+psycopg://', 'postgresql+psycopg2://', 1)
    return url


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    SQLALCHEMY_DATABASE_URI = normalize_database_url(
        os.getenv('DATABASE_URL', 'postgresql://user:password@db:5432/crime_analysis')
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    REDIS_URL = os.getenv('REDIS_URL')
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL')
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND')
    DATA_DIR = DATA_DIR
    UPLOAD_FOLDER = DATA_DIR
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')

class DevelopmentConfig(Config):
    DEBUG = True
    # Use DATABASE_URL if set (for Docker), else sqlite
    SQLALCHEMY_DATABASE_URI = normalize_database_url(
        os.getenv('DATABASE_URL', 'sqlite:///crime_analysis.db')
    )

class ProductionConfig(Config):
    DEBUG = True

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}