# Crime Analysis Web Application

A comprehensive Python web application for analyzing geolocated crime data with interactive heatmap visualization.

## Features

- **AI-Powered Natural Language Queries**: Ask questions about crime data in plain English or Portuguese
- **Intelligent Chart Recommendations**: AI suggests relevant visualizations based on your questions
- **Data Ingestion**: Upload CSV/Excel files with crime data or integrate with external APIs
- **Geospatial Analysis**: Interactive heatmaps, spatial clustering, and location-based statistics
- **Temporal Analysis**: Crime patterns by hour, day, week, and month
- **Interactive Dashboard**: Filter by crime type, date range, and severity
- **Data Export**: Export analysis results in JSON, CSV, or Excel formats
- **Geocoding**: Automatic address-to-coordinates conversion
- **Modern UI**: Responsive web interface with React, Tailwind CSS, and interactive charts

## Tech Stack

- **Backend**: Flask, SQLAlchemy
- **Database**: SQLite (with PostgreSQL support)
- **AI/ML**: MLX-LM (local language models), OpenAI API (optional)
- **Frontend**: React, Vite, Tailwind CSS, Chart.js, Leaflet.js
- **Analysis**: Pandas, Scikit-learn, Shapely
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

## AI Natural Language Queries

### Overview

The application features an advanced AI chat interface that allows you to analyze crime data using natural language queries in English or Portuguese. The system uses local MLX language models to parse your questions, execute relevant database queries, and provide insightful responses with chart recommendations.

### Example Queries

**Temporal Analysis:**
- "What crimes happen most often during evenings?"
- "Show me crime trends by month for 2024"
- "Compare weekday vs weekend crime patterns"
- "What's the hourly distribution of thefts?"

**Geographic Analysis:**
- "Which cities have the highest crime rates?"
- "Show me crime patterns in Salvador"
- "What areas should we focus police patrols on?"

**Crime Type Analysis:**
- "What are the most common crime types?"
- "How have robbery rates changed over time?"
- "Compare theft vs assault incidents"

**Portuguese Queries:**
- "Quais crimes acontecem mais à noite?"
- "Mostre-me as tendências de crime em Salvador"
- "Quais são os tipos de crime mais comuns?"

### AI Setup

#### Option 1: Local MLX Model (Recommended)

Install MLX-LM for local, private AI processing:

```bash
# Install MLX-LM
pip install mlx-lm

# The app will automatically download the default model on first use
# Default model: mlx-community/gpt-oss-20b-MXFP4-Q8
```

#### Option 2: Cloud API (Alternative)

For better accuracy, you can configure cloud AI providers:

```python
# In config/config.py, set:
USE_CLOUD_LLM = True
OPENAI_API_KEY = "your-api-key"  # Optional
```

### Chat Interface Features

- **Interactive Chat**: Ask questions in natural language
- **Smart Parsing**: Automatically converts questions to database queries
- **Dynamic Filtering**: Extracts filters from your questions (dates, locations, crime types)
- **Chart Suggestions**: AI recommends relevant visualizations
- **Thinking Process**: View the AI's reasoning (when available)
- **Bilingual Support**: Works in English and Portuguese

## API Endpoints

### Core Endpoints
- `GET /` - Main dashboard
- `POST /api/upload` - Upload crime data files
- `GET /api/crimes` - Retrieve filtered crime data
- `GET /api/heatmap` - Get heatmap data
- `GET /api/statistics` - Get location-based statistics
- `GET /api/export` - Export analysis results

### AI Chat Endpoints
- `POST /api/chat` - Natural language query processing

#### Chat API Usage

```javascript
// Send natural language query
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "What crimes happen most during weekends?",
    filters: { start_date: "2024-01-01", end_date: "2024-12-31" }
  })
});

const data = await response.json();
console.log(data.response);     // AI analysis
console.log(data.thinking);     // AI reasoning process
console.log(data.chart_suggestion); // Recommended chart
```

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
# Run all tests
python -m pytest

# Test NL parsing specifically
python -m pytest tests/test_nl_parsing.py -v

# Quick integration test
python test_nl_integration.py
```

### Code Formatting
```bash
black .
flake8 .
```

### Testing Natural Language Queries

Use the provided integration test script:

```bash
python test_nl_integration.py
```

This will test:
- NL parsing prompt generation
- Query extraction and filtering
- Response generation
- Chart recommendations

## Troubleshooting

### AI Chat Issues

**Problem**: "Model loading failed" or slow responses
**Solution**:
- Ensure MLX-LM is installed: `pip install mlx-lm`
- The first query may be slow as the model downloads
- Consider using a smaller model for faster responses

**Problem**: Inaccurate query parsing
**Solution**:
- Be specific in your questions
- Include relevant keywords (crime types, dates, locations)
- Use complete sentences rather than fragments

**Problem**: No chart suggestions appearing
**Solution**:
- Ensure your query relates to visualizable data
- Try queries about trends, distributions, or comparisons

### Performance Optimization

- **Large Datasets**: The app automatically limits results for performance
- **Caching**: Responses are cached to improve speed
- **Local Processing**: MLX models run locally for privacy and speed

### Database Issues

If you encounter database errors:
1. Ensure your data follows the expected format (see Data Format section)
2. Check that date fields are properly formatted
3. Verify that required columns exist in your CSV uploads

## License

This project is licensed under the MIT License.