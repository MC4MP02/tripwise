import os
import requests
from dotenv import load_dotenv

load_dotenv()

def get_places(destination: str):
    api_key = os.getenv("GOOGLE_API_KEY")
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {"query": destination, "key": api_key}
    response = requests.get(url, params=params)
    return response.json()


