from dotenv import load_dotenv
import requests
import os

load_dotenv()
API_KEY = os.getenv("VITE_OPENWEATHER_API_KEY")

def get_weather(city):
    url = "https://api.openweathermap.org/data/2.5/weather"
    
    params = {
        "q": city,
        "appid": API_KEY,
        "units": "metric"
    }
    
    try:
        response = requests.get(url, params=params, timeout=3)
        
        if response.status_code != 200:
            return "Clear", 25, None, None  
        
        data = response.json()
        
        weather = data['weather'][0]['main']
        temp = data['main']['temp']
        lat = data['coord']['lat']
        lon = data['coord']['lon']
        
        return weather, temp, lat, lon
    
    except Exception as e:
        print("Weather API Error:", e)
        return "Clear", 25, None, None  