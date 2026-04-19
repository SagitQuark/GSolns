from flask.cli import load_dotenv
import requests
import os
load_dotenv()

Weather_API_KEY = os.getenv("Weather_API_KEY")

def get_weather(city):
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}"
    response = requests.get(url).json()
    
    weather = response['weather'][0]['main']
    temp = response['main']['temp']
    
    return weather, temp