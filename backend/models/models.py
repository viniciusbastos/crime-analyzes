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

class IbgeDemographicData(db.Model):
    """IBGE demographic and socioeconomic data by municipality"""
    __tablename__ = 'ibge_demographic_data'

    id = Column(Integer, primary_key=True)
    municipality_code = Column(String(20), nullable=False)  # IBGE municipality code (7 digits)
    municipality_name = Column(String(200), nullable=False)
    state_code = Column(String(2), nullable=False)  # UF code
    state_name = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)

    # Population data
    total_population = Column(Integer, nullable=True)
    urban_population = Column(Integer, nullable=True)
    rural_population = Column(Integer, nullable=True)

    # Age distribution
    population_0_14 = Column(Integer, nullable=True)  # 0-14 years
    population_15_64 = Column(Integer, nullable=True)  # 15-64 years
    population_65_plus = Column(Integer, nullable=True)  # 65+ years

    # Gender distribution
    male_population = Column(Integer, nullable=True)
    female_population = Column(Integer, nullable=True)

    # Socioeconomic indicators
    gini_coefficient = Column(Float, nullable=True)  # Income inequality index
    average_income = Column(Float, nullable=True)  # Average household income
    poverty_rate = Column(Float, nullable=True)  # Percentage below poverty line

    # Education indicators
    literacy_rate = Column(Float, nullable=True)  # Literacy rate (%)
    school_enrollment_rate = Column(Float, nullable=True)  # School enrollment rate (%)

    # Health indicators
    life_expectancy = Column(Float, nullable=True)  # Life expectancy at birth
    infant_mortality_rate = Column(Float, nullable=True)  # Infant mortality per 1000 births

    # Economic indicators
    gdp_per_capita = Column(Float, nullable=True)  # GDP per capita
    unemployment_rate = Column(Float, nullable=True)  # Unemployment rate (%)

    # Housing indicators
    households_with_water = Column(Float, nullable=True)  # % households with treated water
    households_with_sewage = Column(Float, nullable=True)  # % households with sewage system

    # Metadata
    data_source = Column(String(100), nullable=False)  # SIDRA table reference
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('idx_ibge_municipality_year', 'municipality_code', 'year'),
        Index('idx_ibge_state_year', 'state_code', 'year'),
        Index('idx_ibge_data_source', 'data_source'),
        Index('idx_ibge_last_updated', 'last_updated'),
    )

class IbgeDataCache(db.Model):
    """Cache for IBGE API responses"""
    __tablename__ = 'ibge_data_cache'

    id = Column(Integer, primary_key=True)
    cache_key = Column(String(500), unique=True, nullable=False)
    data = Column(Text, nullable=False)  # JSON data
    created_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=False)

    __table_args__ = (
        Index('idx_ibge_cache_key', 'cache_key'),
        Index('idx_ibge_cache_expires', 'expires_at'),
    )