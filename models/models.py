from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Index
from sqlalchemy.sql import func

db = SQLAlchemy()

class Crime(db.Model):
    __tablename__ = 'crimes'

    id = Column(Integer, primary_key=True)
    crime_type = Column(String(100), nullable=False)
    date_time = Column(DateTime, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(Text)

    # Location fields
    city = Column(String(100), nullable=True)

    severity = Column(String(50))
    description = Column(Text)

    __table_args__ = (
        Index('idx_crimes_date_time', 'date_time'),
        Index('idx_crimes_crime_type', 'crime_type'),
        Index('idx_crimes_city', 'city'),
    )

class Location(db.Model):
    __tablename__ = 'locations'

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    type = Column(String(50))  # neighborhood, district, etc.
    # For SQLite compatibility, store boundary as text (WKT format)
    boundary = Column(Text)  # WKT format for polygon boundaries

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