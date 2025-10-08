-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crimes_geom ON crimes USING gist (geom);
CREATE INDEX IF NOT EXISTS idx_crimes_date_time ON crimes (date_time);
CREATE INDEX IF NOT EXISTS idx_crimes_crime_type ON crimes (crime_type);
CREATE INDEX IF NOT EXISTS idx_locations_boundary ON locations USING gist (boundary);