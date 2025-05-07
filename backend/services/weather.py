import os
import requests
from dotenv import load_dotenv

load_dotenv()

def get_weather(city: str):
    api_key = os.getenv("ACCUWEATHER_API_KEY")

    # 1. Obtener location key
    location_url = "http://dataservice.accuweather.com/locations/v1/cities/search"
    loc_params = {"apikey": api_key, "q": city}
    loc_response = requests.get(location_url, params=loc_params)

    if loc_response.status_code != 200:
        return {"error": "Error al buscar ciudad"}

    loc_data = loc_response.json()

    if not loc_data:
        return {"error": f"No se encontró ninguna ciudad con el nombre '{city}'"}

    location_key = loc_data[0].get("Key")
    if not location_key:
        return {"error": "No se pudo obtener el location key"}

    # 2. Obtener previsión
    weather_url = f"http://dataservice.accuweather.com/forecasts/v1/daily/1day/{location_key}"
    weather_params = {"apikey": api_key, "metric": True}
    weather_response = requests.get(weather_url, params=weather_params)

    if weather_response.status_code != 200:
        return {"error": "Error al obtener la previsión del tiempo"}

    return weather_response.json()
