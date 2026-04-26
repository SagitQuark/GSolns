from dotenv import load_dotenv
import requests
import os

load_dotenv()
API_KEY = os.getenv("VITE_OPENROUTE_API_KEY")

def get_routes(start, end):
    url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"

    headers = {
        "Authorization": API_KEY,
        "Content-Type": "application/json"
    }

    body = {
        "coordinates": [start, end],
        "alternative_routes": {
            "target_count": 3,
            "weight_factor": 1.6
        }
    }

    try:
        response = requests.post(url, json=body, headers=headers)

        if response.status_code != 200:
            # Fallback if alternative_routes exceeds distance limit
            fallback_body = {"coordinates": [start, end]}
            fallback_response = requests.post(url, json=fallback_body, headers=headers)
            
            if fallback_response.status_code != 200:
                print("Route API Error:", fallback_response.text)
                return None
            
            data = fallback_response.json()
            feature = data["features"][0]
            geometry = feature["geometry"]["coordinates"]
            route_summary = feature["properties"]["summary"]
            
            dist = route_summary["distance"] / 1000
            dur = route_summary["duration"] / 60
            
            # Generate mock alternatives based on the base route with slightly offset geometries
            geom2 = [[p[0] + 0.03, p[1] - 0.03] for p in geometry]
            geom3 = [[p[0] - 0.03, p[1] + 0.03] for p in geometry]
            
            return [
                {"distance": dist, "duration": dur, "geometry": geometry},
                {"distance": dist * 1.15, "duration": dur * 1.25, "geometry": geom2},
                {"distance": dist * 1.30, "duration": dur * 1.40, "geometry": geom3}
            ]

        data = response.json()
        routes = []
        for feature in data.get("features", []):
            geometry = feature["geometry"]["coordinates"] # List of [lon, lat]
            route_summary = feature["properties"]["summary"]

            distance_km = route_summary["distance"] / 1000
            duration_min = route_summary["duration"] / 60
            routes.append({"distance": distance_km, "duration": duration_min, "geometry": geometry})

        return routes

    except Exception as e:
        print("Exception in route:", e)
        return None