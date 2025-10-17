from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Index
from sqlalchemy.sql import func
from werkzeug.security import generate_password_hash, check_password_hash
from geoalchemy2 import Geometry

db = SQLAlchemy()

class Crime(db.Model):
    __tablename__ = 'crimes'

    id = Column(Integer, primary_key=True)
    crime_type = Column(String(100), nullable=False)
    date_time = Column(DateTime, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    geom = Column(Geometry('POINT', srid=4326))
    address = Column(Text)

    # Location fields
    city = Column(String(100), nullable=True)

    severity = Column(String(50))
    description = Column(Text)
    category_parent = Column(String(50), nullable=True)

    # Police organizational fields
    unidade = Column(String(100), nullable=True)  # OPM (e.g., "6ª CIPM - Rio Real")
    aisp = Column(Integer, nullable=True)  # AISP number (e.g., 48)
    risp = Column(String(50), nullable=True)  # RISP (parent category, e.g., "LESTE")

    __table_args__ = (
        Index('idx_crimes_date_time', 'date_time'),
        Index('idx_crimes_crime_type', 'crime_type'),
        Index('idx_crimes_city', 'city'),
        Index('idx_crimes_unidade', 'unidade'),
        Index('idx_crimes_aisp', 'aisp'),
        Index('idx_crimes_risp', 'risp'),
        # Composite indexes for common query patterns
        Index('idx_crimes_lat_lng', 'latitude', 'longitude'),
        Index('idx_crimes_city_date', 'city', 'date_time'),
        Index('idx_crimes_type_date', 'crime_type', 'date_time'),
        Index('idx_crimes_unidade_date', 'unidade', 'date_time'),
        # Index for geospatial queries
        Index('idx_crimes_geom', 'geom'),
    )

class Location(db.Model):
    __tablename__ = 'locations'

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    type = Column(String(50))  # neighborhood, district, etc.
    boundary = Column(Geometry('POLYGON', srid=4326))

class AnalysisCache(db.Model):
    __tablename__ = 'analysis_cache'

    id = Column(Integer, primary_key=True)
    cache_key = Column(String(200), unique=True, nullable=False)
    data = Column(Text, nullable=False)  # JSON data
    created_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime)

    __table_args__ = (
        Index('idx_analysis_cache_key', 'cache_key'),
        Index('idx_analysis_cache_expires', 'expires_at'),
    )

class User(db.Model):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default='viewer', nullable=False)
    unidade = Column(String(100), nullable=True)  # Police unit (OPM) for filtering
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime, nullable=True)
    is_active = Column(db.Boolean, default=True, nullable=False)
    created_by = Column(Integer, nullable=True)  # Admin who created the user

    __table_args__ = (
        Index('idx_users_email', 'email'),
        Index('idx_users_unidade', 'unidade'),
        Index('idx_users_role', 'role'),
        Index('idx_users_created_at', 'created_at'),
        Index('idx_users_is_active', 'is_active'),
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class UploadLog(db.Model):
    __tablename__ = 'upload_logs'

    id = Column(Integer, primary_key=True)
    filename = Column(String(255), nullable=False)
    upload_time = Column(DateTime, server_default=func.now(), nullable=False)
    records_processed = Column(Integer, nullable=False)
    records_loaded = Column(Integer, nullable=False)
    duplicates_skipped = Column(Integer, default=0)
    status = Column(String(50), default='success', nullable=False)  # success, error
    message = Column(Text)

    __table_args__ = (
        Index('idx_upload_logs_time', 'upload_time'),
    )

class QueryHistory(db.Model):
    __tablename__ = 'query_history'

    id = Column(Integer, primary_key=True)
    user_query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    thinking = Column(Text)
    filters_applied = Column(Text)  # JSON string of applied filters
    timestamp = Column(DateTime, server_default=func.now(), nullable=False)
    response_time_ms = Column(Integer)  # Response time in milliseconds
    user_id = Column(Integer)  # Optional user ID for authenticated users

    __table_args__ = (
        Index('idx_query_history_timestamp', 'timestamp'),
        Index('idx_query_history_user_id', 'user_id'),
    )

class UserActivityLog(db.Model):
    __tablename__ = 'user_activity_logs'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)  # User who performed the action
    action = Column(String(100), nullable=False)  # login, logout, create_user, update_user, delete_user, etc.
    target_user_id = Column(Integer, nullable=True)  # User affected by the action (for admin actions)
    details = Column(Text)  # JSON string with additional details
    ip_address = Column(String(45), nullable=True)  # IPv4/IPv6 address
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        Index('idx_user_activity_user_id', 'user_id'),
        Index('idx_user_activity_action', 'action'),
        Index('idx_user_activity_timestamp', 'timestamp'),
        Index('idx_user_activity_target_user', 'target_user_id'),
    )