import requests
from dotenv import load_dotenv
import os
load_dotenv()

API_KEY = os.getenv("Route_API_KEY")

def get_route(source, destination):
    url = "https://api.openrouteservice.org/v2/directions/driving-car"
    
    headers = {"Authorization": API_KEY,
                "Content-Type": "application/json"}
    body = {
        "coordinates": [source, #[lon, lat]
                        destination]
    }
    
    response = requests.post(url, json=body, headers=headers)
                             
    if response.status_code != 200:
        print("Route API Errror:", response.text)
        return None
        
    data = response.json()
    route = data["features"][0]["properties"]["segments"][0]
    
    distance_km = route["distance"] / 1000
    duration_min = route["duration"] / 60
    
    return distance_km, duration_min
    
print("Route Key:", API_KEY)