# LogiRisk AI — Full Stack Setup Guide

## Quick Start

### Backend (FastAPI)
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run backend (from project root)
python -m uvicorn main:app --reload
# API available at: http://localhost:8000
```

### Frontend (Vite + React)
```bash
# Navigate to frontend folder
cd frontend

# Install all Node dependencies
npm install

# Run dev server
npm run dev -- --force
# UI available at: http://localhost:5173
```

---

## Backend Dependencies (requirements.txt)

| Package | Purpose |
|---|---|
| `fastapi` | REST API framework |
| `uvicorn[standard]` | ASGI server with full async support |
| `pydantic` | Request/response data validation |
| `pandas` | Data manipulation |
| `numpy` | Numerical computing for ML risk scoring |
| `scikit-learn` | K-Means clustering + ML utilities |
| `joblib` | ML model serialization (.pkl loading) |
| `requests` | OpenWeather + OpenRouteService HTTP calls |
| `plotly` | Analytics chart data generation |
| `matplotlib` | ML training visualizations |
| `python-dotenv` | `.env` file loading for API keys |
| `sqlite3` | Built-in Python — live DB (no install needed) |

---

## Frontend Dependencies (package.json)

| Package | Purpose |
|---|---|
| `react` + `react-dom` | Core React framework |
| `react-router-dom` | Multipage dashboard routing |
| `axios` | HTTP client for FastAPI calls |
| `react-leaflet` | Interactive geospatial map component |
| `leaflet` | Base map rendering engine |
| `leaflet.heat` | Heatmap overlay plugin (Risk Simulation page) |
| `react-is` | React fragment detection (required by recharts) |
| `recharts` | Analytics & clustering charts |
| `lucide-react` | Icon library (alerts, navigation icons) |
| `vite` | Build tool + dev server |

---

## Environment Variables (.env)
```
VITE_OPENWEATHER_API_KEY=your_key_here
VITE_OPENROUTE_API_KEY=your_key_here
```


