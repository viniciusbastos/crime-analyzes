# Project: Crime Analysis

## Overview
This project is a comprehensive crime analysis system with a web frontend, a mobile application, and a Python-based backend. It utilizes AI (LLMs and RAG) to analyze crime data and provide insights.

## Architecture & Tech Stack

### Backend
- **Framework:** Flask (Factory Pattern)
- **Authentication:** JWT (flask-jwt-extended)
- **Database:** PostgreSQL with PostGIS (SQLAlchemy & GeoAlchemy2)
- **Task Queue:** Celery with Redis
- **AI/Vector DB:** ChromaDB, Ollama, sentence-transformers
- **Key Libraries:** pandas, geopandas, scikit-learn

### Frontend
- **Framework:** React (Vite)
- **Styling:** Tailwind CSS
- **State Management:** TanStack Query (React Query)
- **Components:** Custom Dashboard and Login, ThemeContext, AuthProvider
- **Maps:** Leaflet, Mapbox GL
- **Charts:** Chart.js, D3.js

### Mobile
- **Framework:** React Native (Expo)
- **State Management:** TanStack Query (React Query)
- **UI:** React Native Paper
- **Navigation:** React Navigation (AppNavigator)
- **Maps:** React Native Maps, @rnmapbox/maps

## Development Workflows

### Setup
- Backend: `pip install -r backend/requirements.txt`
- Frontend: `npm install` in `frontend/`
- Mobile: `npm install` in `mobile/`

### Running the App
- Backend: `export FLASK_APP=app.py && flask run` (from `backend/`)
- Frontend: `npm run dev` (from `frontend/`)
- Mobile: `npx expo start` (from `mobile/`)

## Conventions
- **Python:** PEP 8, app factory pattern, type hints where possible.
- **React/Mobile:** Functional components, custom hooks for state/logic, Context API for global state (Auth, Theme).
- **API:** Standardized on `axios`, JWT-based authentication.
- **I18n:** `react-i18next` for internationalization.
