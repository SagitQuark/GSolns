def get_route(start, end):
    import requests
    import os
    from dotenv import load_dotenv

    load_dotenv()
    API_KEY = os.getenv("ROUTE_API_KEY")

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

        data = response.json()

        if "features" not in data:
            return None

        route_data = data["features"][0]

        # ✅ get route line
        coordinates = route_data["geometry"]["coordinates"]

        # ✅ get distance/time
        segment = route_data["properties"]["segments"][0]
        distance_km = segment["distance"] / 1000
        duration_min = segment["duration"] / 60

        return coordinates, distance_km, duration_min

    except Exception as e:
        print("Route error:", e)
        return None