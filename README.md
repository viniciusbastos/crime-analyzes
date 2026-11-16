# Crime Analysis

A web and mobile platform for analyzing geolocated crime data, with interactive maps, trend analysis, and an AI chat for natural language questions. It is built around police incident data from the state of Bahia, Brazil, and includes filters for police organizational units (OPM, AISP, and RISP).

## Features

- **AI Chat**: Ask questions about crime data in English or Portuguese, with answers supported by retrieval (RAG)
- **Data Upload**: Admins can upload CSV files with row-level rejection reporting and duplicate detection
- **Maps**: Heatmaps, crime points, clusters, and density views
- **Temporal Analysis**: Hourly, weekday/weekend, monthly, and semester patterns
- **Trends**: Year-over-year comparison, growth rates, moving averages, and forecasts
- **Incident-Free Periods**: Find periods without recorded incidents
- **Demographic Correlation**: Compare crime with IBGE population and socioeconomic data
- **Authentication**: JWT login, `admin` and `viewer` roles, and activity logs
- **Data Export**: Export results as JSON, CSV, or Excel
- **Mobile App**: React Native (Expo) client in `mobile/`
- **Internationalization**: English and Brazilian Portuguese

## Tech Stack

- **Backend**: Python 3.12, Flask, SQLAlchemy, GeoAlchemy2, Flask-Migrate, Gunicorn
- **Database**: PostgreSQL 16 with PostGIS
- **Cache**: Redis
- **AI**: MLX-LM or Transformers for text generation, Ollama for embeddings, ChromaDB for vector storage
- **Analysis**: Pandas, GeoPandas, Scikit-learn, Shapely
- **Web Frontend**: React 19, Vite, Tailwind CSS, TanStack Query, Chart.js, D3, Leaflet, Mapbox GL
- **Mobile**: Expo, React Native Paper, React Navigation
- **Deployment**: Docker Compose, Nginx

## Project Structure

```
backend/
  app.py              Flask application factory
  config/             Application configuration
  controllers/        Upload handling
  migrations/         Alembic database migrations
  models/             SQLAlchemy models
  routes/             API (routes.py) and authentication (auth.py) endpoints
  services/           Crime data, cache, chat, RAG, and IBGE services
  tests/              Pytest suite
frontend/             React web application
mobile/               Expo mobile application
```

## Quick Start

### Using Docker

1. Create the environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env`:
   - Set `SECRET_KEY`, `JWT_SECRET_KEY`, and `POSTGRES_PASSWORD`, and use the same password in `DATABASE_URL`.
   - Set `REDIS_URL=redis://redis:6379/0`. The template value points to `localhost`, which does not reach the Redis container.
   - Keep `POSTGRES_USER=user` and `POSTGRES_DB=crime_analysis` unless you also change the database healthcheck in `docker-compose.yaml`.

3. Start the services:

   ```bash
   docker-compose up --build
   ```

| Service | URL |
|---------|-----|
| Web application | `http://localhost:8080` |
| API | `http://localhost:5005/api` |
| API documentation | `http://localhost:5005/api/docs` |

On startup, the API container runs the database migrations and creates a default admin user if no users exist.

> **Security:** The default login is `admin@example.com` / `admin123`. Change this password immediately, and do not expose the application before you do.

#### ARM64 Systems

Use the ARM64 Compose file on systems such as Apple Silicon or Raspberry Pi:

```bash
docker-compose -f docker-compose.arm64.yaml up --build
```

This file does not publish any ports to the host. To reach the application, add a `ports` entry to the `frontend` service or connect it through a reverse proxy. It also does not mount the backend source code, so rebuild the image after backend changes.

### Manual Setup

1. Create the database:

   ```sql
   CREATE DATABASE crime_analysis;
   \c crime_analysis
   CREATE EXTENSION postgis;
   ```

2. Create `.env` from `.env.example` in the repository root. Set `DATABASE_URL` to your local database, for example `postgresql://user:password@localhost:5432/crime_analysis`.

3. Install the backend dependencies, apply the migrations, and start the API on port 5001:

   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   FLASK_APP=app flask db upgrade
   python app.py
   ```

   Set `FLASK_RUN_PORT` to use a different port.

4. In a second terminal, start the web frontend:

   ```bash
   cd frontend
   npm install
   VITE_API_BASE_URL=http://localhost:5001 npm run dev
   ```

   The Vite development server forwards `/api` and `/auth` to this address. Without the variable, it uses port 5000.

5. Optionally, start the mobile app. See `mobile/README.md` for details:

   ```bash
   cd mobile
   npm install
   npx expo start
   ```

## AI Chat

The chat parses each question into filters, queries the database, retrieves related knowledge from ChromaDB, and generates an answer.

### Example Queries

**Temporal Analysis:**
- "What crimes happen most often during evenings?"
- "Show me crime trends by month for 2024"
- "Compare weekday vs weekend crime patterns"

**Geographic Analysis:**
- "Which cities have the highest crime rates?"
- "Show me crime patterns in Salvador"

**Crime Type Analysis:**
- "What are the most common crime types?"
- "How have robbery rates changed over time?"

**Portuguese Queries:**
- "Quais crimes acontecem mais à noite?"
- "Mostre-me as tendências de crime em Salvador"
- "Quais são os tipos de crime mais comuns?"

### AI Setup

**Text generation** uses the first option available:

1. **MLX-LM**, on Apple Silicon only. It is not in `requirements.txt`, so install it separately with `pip install mlx-lm`. The default model, `mlx-community/gpt-oss-20b-MXFP4-Q8`, downloads on first use.
2. **Transformers with `gpt2`**, when MLX-LM is not installed. This includes the Docker images. Expect much lower answer quality.
3. **A built-in template response**, when model generation fails.

**Embeddings** use Ollama, which is not part of the Docker Compose setup. Install and start Ollama, and then download the model:

```bash
ollama pull mxbai-embed-large
```

## API Endpoints

Interactive documentation is available at `/api/docs`. The main endpoints are:

### Authentication (`/auth`)

- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/forgot-password`
- `GET /auth/validate`
- `GET`, `PUT /auth/profile`
- `POST /auth/change-password`
- `GET`, `POST /auth/users`, and `PUT`, `DELETE /auth/users/<id>`
- `GET /auth/activity-logs`

### Crime Data (`/api`)

- `GET`, `POST /api/crimes`, and `GET`, `PUT`, `DELETE /api/crimes/<id>`
- `GET /api/crimes/types`
- `POST /api/upload`, `GET /api/last-upload`
- `GET /api/export?format=json|csv|excel`

### Maps

- `GET /api/heatmap`, `/api/heatmap/geojson`, `/api/heatmap/html`
- `GET /api/crime-points`, `/api/density`, `/api/spatial`

### Analysis

- `GET /api/summary`, `/api/temporal`, `/api/semester-comparison`, `/api/incident-free-periods`
- `GET /api/trends/year-over-year`, `/api/trends/growth-rates`, `/api/trends/moving-averages`, `/api/trends/weekly-moving-averages`, `/api/trends/forecast`
- `GET /api/correlations/crime-demographics`, `/api/correlations/socioeconomic-crime/<indicator>`

### Locations and Police Units

- `GET /api/cities`, `/api/locations/cities`
- `GET /api/police/unidades`, `/api/police/aisps`, `/api/police/risps`

### IBGE Data

- `GET /api/ibge/municipality/<code>`, and `/population`, `/demographics`, or `/socioeconomic` under the same path
- `GET /api/ibge/sync/status`
- `POST /api/ibge/sync/bahia`, `/api/ibge/sync/municipalities`, `/api/ibge/cleanup`, `/api/ibge/cache/clear`

### System

- `GET /api/health`, `/api/metrics`, `/api/cache/stats`
- `POST /api/cache/clear`
- `POST /api/system/clear-crime-data` deletes all crime records and cannot be undone. It requires the `admin` role.

### Chat

`POST /api/chat`

```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "What crimes happen most during weekends?",
    filters: { start_date: "2024-01-01", end_date: "2024-12-31" }
  })
});

const data = await response.json();
console.log(data.response);        // Generated answer
console.log(data.thinking);        // Model reasoning, or null
console.log(data.filters_applied); // Filters sent with the request
```

## Data Format

Upload files in CSV format, up to 16 MB. The importer tries UTF-8 and Latin-1 encodings automatically.

| Field | Accepted columns |
|-------|------------------|
| Crime type | `DELITO`, `crime_type`, `type` |
| Date | `DATA`, `date_time`, `datetime`, `date`, or `ANO` + `MES` + `DIA` |
| Hour | `HORA`, `time` |
| Latitude | `LATITUDE`, `latitude`, `lat` |
| Longitude | `LONGITUDE`, `longitude`, `lng` |
| Street | `LOGRADOURO`, `address`, `location` |
| Neighborhood | `BAIRRO`, `neighborhood` |
| City | `MUNICIPIO`, `city` |
| Incident report number | `BO` |
| Police station | `DELEGACIA`, `police_station` |
| Victim gender | `SEXO`, `gender` |
| Victim age | `IDADE`, `age` |
| Police organization | `OPM`, `AISP`, `RISP` |
| Region | `REGIAO`, `regiao`, `COORPIN 2026`, `COORPIN`, `coorpin` |
| IBGE municipality code | `IDMUNICIPIO`, `ID_MUNICIPIO`, `id_municipio` |

The importer does not geocode addresses. Rows are marked as not geocoded when the coordinates are pending or outside the state's bounding box.

## Configuration

`.env.example` lists the available variables. The `.env` and `.env.production` files are not tracked in Git.

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY`, `JWT_SECRET_KEY` | Flask and JWT signing keys. Always replace the defaults. |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Docker database credentials |
| `VITE_API_BASE_URL` | Backend address for the Vite development proxy |
| `DATA_DIR` | Upload directory. The default is `backend/data`. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth credentials (optional) |

Containers read their settings from `.env` through `env_file`. The `docker-compose --env-file .env.production up` command changes only Compose variable substitution, such as the `VITE_API_BASE_URL` build argument. It does not replace the values that containers load from `.env`.

## Development

### Running Tests

Install pytest, which is not in `requirements.txt`:

```bash
pip install pytest
```

Run the conversion and route tests from `backend/`:

```bash
cd backend
python -m pytest tests/test_convert_crime_data.py tests/test_routes.py
```

Run the natural language parsing tests from the repository root, because they import the `backend` package:

```bash
python -m pytest backend/tests/test_nl_parsing.py
```

### Database Migrations

Run these commands from `backend/`:

```bash
FLASK_APP=app flask db migrate -m "Description of changes"
FLASK_APP=app flask db upgrade
```

### Linting

```bash
cd frontend
npm run lint
```

## Troubleshooting

**Chat answers are generic or low quality**
- Install MLX-LM on Apple Silicon. Otherwise, the app uses `gpt2` or a template response.
- The first query can be slow while the model downloads.

**Chat answers lack retrieved context**
- Confirm that Ollama is running and that `mxbai-embed-large` is downloaded.

**The Docker database never becomes healthy**
- The healthcheck expects `POSTGRES_USER=user` and `POSTGRES_DB=crime_analysis`.

**Upload rows are rejected**
- Compare your column names with the Data Format section.
- Check that dates and coordinates are valid. The upload response reports why each row was rejected.

## License

This project is licensed under the MIT License.
