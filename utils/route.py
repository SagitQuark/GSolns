from dotenv import load_dotenv
import requests
import os

load_dotenv()
API_KEY = os.getenv("ROUTE_API_KEY")


def get_route(start, end):
    url = "https://api.openrouteservice.org/v2/directions/driving-car"

    headers = {
        "Authorization": API_KEY,
        "Content-Type": "application/json"
    }

    body = {
        "coordinates": [start, end]
    }

    try:
        response = requests.post(url, json=body, headers=headers)

        if response.status_code != 200:
            print("❌ Route API Error:", response.text)
            return None

        data = response.json()

        # ✅ NEW FORMAT
        route = data["routes"][0]["summary"]

        distance_km = route["distance"] / 1000
        duration_min = route["duration"] / 60

        return distance_km, duration_min

    except Exception as e:
        print("❌ Exception in route:", e)
        return None