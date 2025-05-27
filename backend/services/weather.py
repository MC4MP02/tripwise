import os
import requests

def get_weather(city: str):
    api_key = os.environ.get("ACCUWEATHER_API_KEY")
    if not api_key:
        print("Warning: ACCUWEATHER_API_KEY not set")
        return {
            "temperatura": "-",
            "descripcion": "-",
            "lluvia": False,
            "humedad": "-",
            "viento": "-",
            "sensacion": "-",
            "sensacion_unidad": "-",
        }

    # 1. Obtener location key
    location_url = "http://dataservice.accuweather.com/locations/v1/cities/search"
    loc_params = {"apikey": api_key, "q": city, "language": "es-ES", "details": "false"}

    loc_response = requests.get(location_url, params=loc_params)


    if loc_response.status_code != 200:
        return {"error": "Error al buscar ciudad", "data": loc_response.json() }
    
    loc_data = loc_response.json()

    if not loc_data:
        return {"error": "Error al buscar ciudad", "data": loc_data}
    
    location_key = loc_data[0]["Key"]
    nombre_ciudad = loc_data[0]["LocalizedName"]
    pais = loc_data[0]["Country"]["LocalizedName"]

    # 2. Obtener previsión
    url_clima = f"http://dataservice.accuweather.com/currentconditions/v1/{location_key}"
    weather_url = f"http://dataservice.accuweather.com/forecasts/v1/daily/1day/{location_key}"
    weather_params = {"apikey": api_key, "details": "true", "language": "es-ES"}

    weather_response = requests.get(url_clima, params=weather_params)
    if weather_response.status_code != 200:
       return {
            "temperatura": "-",
            "descripcion": "-",
            "lluvia": False,
            "humedad": "-",
            "viento": "-",
            "sensacion": "-",
            "sensacion_unidad": "-",
        }
    
    clima_data  = weather_response.json()

    clima = clima_data[0]

    return {
        "ciudad": nombre_ciudad,
        "pais": pais,
        "temperatura": clima["Temperature"]["Metric"]["Value"],
        "unidad": clima["Temperature"]["Metric"]["Unit"],
        "descripcion": clima["WeatherText"],
        "lluvia": clima.get("HasPrecipitation", False),
        "humedad": clima.get("RelativeHumidity"),
        "viento": clima.get("Wind", {}).get("Speed", {}).get("Metric", {}).get("Value"),
        "sensacion": clima.get("RealFeelTemperature", {}).get("Metric", {}).get("Phrase"),
        "sensacion_unidad": clima.get("RealFeelTemperature", {}).get("Metric", {}).get("Value"),
    }
