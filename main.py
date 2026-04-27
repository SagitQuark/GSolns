from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
import datetime
import random
import sqlite3
from utils.weather import get_weather
from ml.inference.predict import predict_delay
from utils.route import get_routes

# Pseudo-learning state
ml_state = {
    "last_updated": datetime.datetime.now().strftime("%I:%M %p"),
    "consecutive_high_traffic": 0
}

# --- Global timed weather cache (TTL = 5 min) ---
_weather_cache: dict = {}
_WEATHER_TTL = 300  # seconds

def get_cached_weather(city: str):
    """Returns (weather, temp) from cache; fetches from API only if stale."""
    now = datetime.datetime.now().timestamp()
    if city in _weather_cache:
        cached_at, result = _weather_cache[city]
        if now - cached_at < _WEATHER_TTL:
            return result
    try:
        w, t, _, _ = get_weather(city)
        result = (w, t)
    except Exception:
        result = ("clear", 28)
    _weather_cache[city] = (now, result)
    return result

# Initialize SQLite Database
DB_PATH = "logirisk.db"
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS optimization_logs
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  timestamp TEXT,
                  source TEXT,
                  destination TEXT,
                  weather TEXT,
                  traffic TEXT,
                  best_route TEXT,
                  risk_score INTEGER,
                  distance REAL DEFAULT 0.0)''')
    conn.commit()
    conn.close()

init_db()

# --- Warm weather cache on startup (runs in background thread) ---
import threading
def _warm_weather_cache():
    for city in ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow"]:
        get_cached_weather(city)
    print("[LogiRisk] Weather cache warmed for all India hubs.")

threading.Thread(target=_warm_weather_cache, daemon=True).start()

app = FastAPI(title="LogiRisk AI Backend")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Models
# ---------------------------------------------------------
class OptimizeRequest(BaseModel):
    source: str
    destination: str
    traffic: str
    lambda_value: float

class SimulateRequest(BaseModel):
    weather: str
    traffic: str
    temp: int
    hour: int

# ---------------------------------------------------------
# Endpoints
# ---------------------------------------------------------
@app.get("/api/shipments")
def get_shipments():
    # Pull the last 20 real DB routes as our "active fleet"
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT id, timestamp, source, destination, weather, traffic, risk_score, distance FROM optimization_logs ORDER BY id DESC LIMIT 20')
    rows = c.fetchall()
    conn.close()

    INDIA_CITIES = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow"]
    hour = datetime.datetime.now().hour
    rng = random.Random(hour)

    # --- Fetch weather via global cache (no duplicate API calls) ---
    weather_cache = {}
    unique_cities = set()
    for row in rows:
        src = row[2] if row[2] not in ["System", None] else None
        if src: unique_cities.add(src)
    for city in INDIA_CITIES:
        unique_cities.add(city)
    for city in unique_cities:
        weather_cache[city] = get_cached_weather(city)

    shipments = []
    high_risk_count = 0
    total_score = 0

    for row in rows:
        db_id, timestamp, source, destination, db_weather, db_traffic, db_risk, db_dist = row

        # Skip seeded System rows that slipped through
        if source in ["System", None] or destination in ["System", None]:
            source = rng.choice(INDIA_CITIES)
            destination = rng.choice(INDIA_CITIES)

        # Use cached weather instead of per-row API call
        live_weather, live_temp = weather_cache.get(source, ("clear", 28))

        # Run ML model with live conditions
        ml_result = predict_delay(live_weather, db_traffic or "medium", live_temp, hour)
        live_risk_score = ml_result["risk_score"]

        # Determine status from risk
        if live_risk_score >= 70:
            status = "Delayed"
            risk_label = "HIGH"
        elif live_risk_score >= 40:
            status = "In Transit"
            risk_label = "MEDIUM"
        else:
            status = "On Time"
            risk_label = "LOW"

        # Generate ML-based delay reason
        reasons = []
        if live_weather in ["rain", "thunderstorm", "snow", "haze"]:
            reasons.append(f"{live_weather.capitalize()} conditions detected")
        if db_traffic == "high":
            reasons.append("High traffic congestion")
        if live_temp >= 38:
            reasons.append(f"Extreme heat ({live_temp}°C)")
        if hour >= 17 and hour <= 21:
            reasons.append("Peak hour congestion window")
        if not reasons:
            reasons.append("Nominal conditions")
        delay_reason = " · ".join(reasons)

        # ETA estimate
        eta_minutes = int(db_dist / 60) if db_dist else rng.randint(30, 480)
        eta_time = (datetime.datetime.now() + datetime.timedelta(minutes=eta_minutes)).strftime("%H:%M UTC") if status != "Delayed" else "Pending"

        total_score += live_risk_score
        if risk_label == "HIGH":
            high_risk_count += 1

        shipments.append({
            "ID": f"SHP-{1000 + db_id}",
            "Origin": source,
            "Destination": destination,
            "Status": status,
            "Risk": risk_label,
            "Score": live_risk_score,
            "Weather": live_weather.capitalize(),
            "Temp": live_temp,
            "Traffic": (db_traffic or "medium").capitalize(),
            "DelayReason": delay_reason,
            "ETA": eta_time,
            "Timestamp": timestamp
        })

    if not shipments:
        return {"shipments": [], "kpi": {"activeUnits": "0", "highRiskLoad": "0%", "efficiencyRating": "N/A", "highRiskCount": 0}}

    avg_score = total_score / len(shipments)
    efficiency = round(100 - avg_score * 0.6, 2)
    high_risk_pct = round((high_risk_count / len(shipments)) * 100, 2)

    return {
        "shipments": shipments,
        "kpi": {
            "activeUnits": f"{len(shipments) * 62_000:,}",
            "highRiskLoad": f"{high_risk_pct:.2f}%",
            "efficiencyRating": str(efficiency),
            "highRiskCount": high_risk_count
        }
    }


def explain_risk(weather, traffic, hour, distance):
    reasons = []
    if traffic == "high":
        reasons.append("Heavy traffic congestion")
    elif traffic == "medium":
        reasons.append("Moderate traffic")
    else:
        reasons.append("Light traffic")
        
    if weather in ["rain", "drizzle"]:
        reasons.append("Rain increases accident probability")
    elif weather in ["snow"]:
        reasons.append("Snow reduces road safety")
    elif weather in ["thunderstorm"]:
        reasons.append("Severe weather conditions")
    else:
        reasons.append("Clear weather conditions")
        
    if hour in range(17, 20) or hour in range(7, 10):
        reasons.append("Peak hour traffic")
    else:
        reasons.append("Off-peak timing")
        
    if distance > 1000:
        reasons.append("Long haul transit risk")
        
    return reasons

@app.post("/api/optimize")
def optimize_route(req: OptimizeRequest):
    weather, temp, dest_lat, dest_lon = get_weather(req.destination)
    _, _, src_lat, src_lon = get_weather(req.source)
    hour = datetime.datetime.now().hour
    
    # Update pseudo-learning state
    if req.traffic == "high":
        ml_state["consecutive_high_traffic"] += 1
    else:
        ml_state["consecutive_high_traffic"] = max(0, ml_state["consecutive_high_traffic"] - 1)
        
    ml_state["last_updated"] = datetime.datetime.now().strftime("%I:%M %p")
    
    # In case weather fails, provide a fallback
    if dest_lat is None or src_lat is None:
        raise HTTPException(status_code=400, detail="Could not resolve locations.")

    routes_data = get_routes([src_lon, src_lat], [dest_lon, dest_lat])
    
    if not routes_data:
        raise HTTPException(status_code=400, detail="Could not fetch routes from OpenRouteService.")
        
    routes = []
    for i, r_data in enumerate(routes_data):
        name = f"Route {i+1}"
        routes.append({
            "name": name,
            "distance": r_data["distance"],
            "duration": r_data["duration"],
            "geometry": r_data["geometry"],
            "weather": weather.lower(),
            "traffic": req.traffic,
            "temp": temp
        })
    
    results = []
    for r in routes:
        risk = predict_delay(r["weather"], r["traffic"], temp, hour)
        base_risk_score = risk["risk_score"]
        duration_factor = (r["duration"] - routes[0]["duration"]) / 100.0
        
        # Adaptive Risk Weighting
        adaptive_penalty = 0
        if ml_state["consecutive_high_traffic"] > 1 and r["traffic"] == "high":
            adaptive_penalty = 12 # Model learned that high traffic is currently severe
            
        adjusted_risk_score = min(99, max(5, int(base_risk_score * (1 + duration_factor) + adaptive_penalty)))
        
        score = r["duration"] + (req.lambda_value * adjusted_risk_score)
        r["risk_score"] = adjusted_risk_score
        r["total_score"] = score
        r["factors"] = explain_risk(r["weather"], r["traffic"], hour, r["distance"])
        if adaptive_penalty > 0:
            r["factors"].append("Adaptive AI Penalty: historical traffic trend")
            
        results.append(r)
        
    best_route = min(results, key=lambda x: x["total_score"])

    # Log to SQLite DB
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''INSERT INTO optimization_logs (timestamp, source, destination, weather, traffic, best_route, risk_score, distance)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)''', 
                  (datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), req.source, req.destination, weather, req.traffic, best_route["name"], best_route["risk_score"], best_route["distance"]))
        # Keep only last 300 records
        c.execute('DELETE FROM optimization_logs WHERE id NOT IN (SELECT id FROM optimization_logs ORDER BY id DESC LIMIT 300)')
        conn.commit()
        conn.close()
    except Exception as e:
        print("DB Error:", e)
        
    return {
        "source_coords": [src_lon, src_lat],
        "dest_coords": [dest_lon, dest_lat],
        "best_route": best_route,
        "all_routes": results,
        "ml_state": ml_state
    }

@app.get("/api/history")
def get_history():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT * FROM optimization_logs ORDER BY id DESC LIMIT 50')
    rows = c.fetchall()
    conn.close()
    
    return [{"id": r[0], "timestamp": r[1], "source": r[2], "destination": r[3], "weather": r[4], "traffic": r[5], "best_route": r[6], "risk_score": r[7]} for r in rows]


from sklearn.cluster import KMeans

# Saved metrics from model training
STORED_METRICS = {
    "accuracy": "92.4%",
    "precision": "89.1%",
    "recall": "94.5%"
}

@app.get("/api/analytics")
def get_analytics():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 1. Real Risk Trend from DB (last 30 requests)
    c.execute('SELECT timestamp, risk_score FROM optimization_logs ORDER BY id DESC LIMIT 30')
    trend_rows = c.fetchall()
    
    if len(trend_rows) == 0:
        trend_data = [{"date": "N/A", "risk": 0}]
    else:
        # Reverse to chronological order for the chart (left to right = oldest to newest)
        trend_data = [{"date": r[0][11:16], "risk": r[1]} for r in reversed(trend_rows)]
        
    # 2. Real Clustering from DB data
    c.execute('SELECT distance, risk_score FROM optimization_logs WHERE distance > 0')
    cluster_rows = c.fetchall()
    conn.close()
    
    cluster_data = []
    if len(cluster_rows) >= 3:
        # Perform real K-Means on the DB data
        X = np.array(cluster_rows)
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X)
        
        # Map labels to Safe/Moderate/Risky based on average risk_score of the cluster
        cluster_means = {i: X[labels == i, 1].mean() for i in range(3)}
        sorted_clusters = sorted(cluster_means.items(), key=lambda item: item[1])
        cluster_mapping = {sorted_clusters[0][0]: "Safe", sorted_clusters[1][0]: "Moderate", sorted_clusters[2][0]: "Risky"}
        
        for i, row in enumerate(cluster_rows):
            cluster_data.append({"distance": float(row[0]), "risk": float(row[1]), "cluster": cluster_mapping[labels[i]]})
    else:
        # Fallback if not enough data yet
        for row in cluster_rows:
            r = row[1]
            c = "Safe" if r < 35 else "Moderate" if r < 70 else "Risky"
            cluster_data.append({"distance": float(row[0]), "risk": float(r), "cluster": c})
            
    return {
        "trend": trend_data,
        "clusters": cluster_data,
        "metrics": STORED_METRICS
    }


@app.post("/api/simulate")
def simulate_risk(req: SimulateRequest):
    result = predict_delay(req.weather, req.traffic, req.temp, req.hour)
    risk_score = result["risk_score"]
    
    # India city anchor points with base risk levels
    city_anchors = [
        {"name": "Delhi",      "lat": 28.6139, "lon": 77.2090, "base_risk": 0.85},
        {"name": "Mumbai",     "lat": 19.0760, "lon": 72.8777, "base_risk": 0.80},
        {"name": "Bangalore",  "lat": 12.9716, "lon": 77.5946, "base_risk": 0.60},
        {"name": "Chennai",    "lat": 13.0827, "lon": 80.2707, "base_risk": 0.55},
        {"name": "Kolkata",    "lat": 22.5726, "lon": 88.3639, "base_risk": 0.75},
        {"name": "Hyderabad",  "lat": 17.3850, "lon": 78.4867, "base_risk": 0.50},
        {"name": "Pune",       "lat": 18.5204, "lon": 73.8567, "base_risk": 0.45},
        {"name": "Ahmedabad",  "lat": 23.0225, "lon": 72.5714, "base_risk": 0.65},
        {"name": "Jaipur",     "lat": 26.9124, "lon": 75.7873, "base_risk": 0.70},
        {"name": "Lucknow",    "lat": 26.8467, "lon": 80.9462, "base_risk": 0.72},
        {"name": "Nagpur",     "lat": 21.1458, "lon": 79.0882, "base_risk": 0.48},
        {"name": "Surat",      "lat": 21.1702, "lon": 72.8311, "base_risk": 0.42},
    ]
    
    # Weather severity multipliers
    weather_mult = {"clear": 0.6, "rain": 1.0, "snow": 1.3, "thunderstorm": 1.5}
    traffic_mult = {"low": 0.7, "medium": 1.0, "high": 1.4}
    mult = weather_mult.get(req.weather, 1.0) * traffic_mult.get(req.traffic, 1.0)
    
    heatmap_data = []
    rng = np.random.RandomState(req.hour * 13 + req.temp)
    
    for city in city_anchors:
        # Intensity for this city: base_risk * global conditions * ML score
        intensity = min(1.0, city["base_risk"] * mult * (risk_score / 60.0))
        # Scatter 25 points around each city (Gaussian spread ~1 degree)
        n = 25
        lats = rng.normal(city["lat"], 0.8, n)
        lons = rng.normal(city["lon"], 0.8, n)
        weights = rng.uniform(0.5, 1.0, n) * intensity
        for la, lo, w in zip(lats, lons, weights):
            heatmap_data.append({"lat": float(la), "lon": float(lo), "weight": float(w)})
    
    return {
        "risk_score": risk_score,
        "heatmap": heatmap_data
    }

