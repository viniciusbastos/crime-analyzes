# Crime Analysis Web Application

A comprehensive Python web application for analyzing geolocated crime data with interactive heatmap visualization.

## Features

- **Data Ingestion**: Upload CSV/Excel files with crime data or integrate with external APIs
- **Geospatial Analysis**: Interactive heatmaps, spatial clustering, and location-based statistics
- **Temporal Analysis**: Crime patterns by hour, day, week, and month
- **Interactive Dashboard**: Filter by crime type, date range, and severity
- **Data Export**: Export analysis results in JSON, CSV, or Excel formats
- **Geocoding**: Automatic address-to-coordinates conversion
- **Modern UI**: Responsive web interface with Leaflet.js maps and Chart.js visualizations

## Tech Stack

- **Backend**: Flask, SQLAlchemy, GeoAlchemy2
- **Database**: PostgreSQL with PostGIS
- **Frontend**: HTML5, CSS3, JavaScript, Leaflet.js, Chart.js
- **Analysis**: Pandas, GeoPandas, Scikit-learn, Shapely
- **Deployment**: Docker, Redis (caching)

## Quick Start

### Using Docker (Recommended)

1. Clone the repository
2. Update the `.env` file with your configuration
3. Run the application:

```bash
docker-compose up --build
```

The application will be available at `http://localhost:5000`

### Manual Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Set up PostgreSQL with PostGIS:
```sql
CREATE DATABASE crime_analysis;
CREATE EXTENSION postgis;
```

3. Update `.env` with your database credentials

4. Run the application:
```bash
python app.py
```

## API Endpoints

- `GET /` - Main dashboard
- `POST /api/upload` - Upload crime data files
- `GET /api/crimes` - Retrieve filtered crime data
- `GET /api/heatmap` - Get heatmap data
- `GET /api/statistics` - Get location-based statistics
- `GET /api/export` - Export analysis results

## Data Format

CSV/Excel files should contain columns:
- `crime_type` - Type of crime
- `date_time` - Date and time of incident
- `latitude` / `longitude` - Coordinates (or `address` for geocoding)
- `address` - Location address
- `severity` - Crime severity level
- `description` - Additional details

## Configuration

Update the `.env` file with your settings:

```
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost/crime_analysis
REDIS_URL=redis://localhost:6379/0
```

## Development

### Running Tests
```bash
python -m pytest
```

### Code Formatting
```bash
black .
flake8 .
```

## License

This project is licensed under the MIT License.