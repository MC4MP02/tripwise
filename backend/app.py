from flask import Flask, request, jsonify, redirect, Response
import requests

from services.google_places import get_places
from services.weather import get_weather
from services.deepL import translate_text

from dotenv import load_dotenv
import os

from flask_cors import CORS

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

app = Flask(__name__)
CORS(app)  # Permitir peticiones del frontend Angular

@app.route('/api/places')
def places():
    destination = request.args.get('destination')
    return jsonify(get_places(destination))

@app.route('/api/weather')
def weather():
    city = request.args.get('city')
            
    return jsonify(get_weather(city))

@app.route('/api/translate')
def translate():
    text = request.args.get('text')
    lang = request.args.get('lang', 'EN')
    return jsonify(translate_text(text, lang))

@app.route('/api/foto')
def obtener_foto():
    photo_ref = request.args.get("photo_ref")
    if not photo_ref:
        return "Falta el parámetro photo_reference", 400
    
    url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photo_reference={photo_ref}&key={GOOGLE_API_KEY}"
    
    response = requests.get(url, stream=True)

    if response.status_code != 200:
        return "No se pudo obtener la imagen", 500
    
    return Response(response.content, content_type=response.headers['Content-Type'])

@app.route('/api/wiki')
def wiki():
    lugar = request.args.get('lugar')
    if not lugar:
        return "Falta el Lugar", 400
    
    url = f"https://es.wikipedia.org/api/rest_v1/page/summary/{lugar}"

    response = requests.get(url)

    if response.status_code != 200:
        return "Error en la peticion"
    
    return Response(response.content, content_type=response.headers['Content-Type'])

@app.route('/api/ia')
def ia():
    lugar = request.args.get('lugar')
    if not lugar:
        return "Falta el Lugar", 400
    
    url = f"https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    }

    data = {
        "model": "meta-llama/llama-3.3-8b-instruct:free",
        "messages": [
            {
                "role": "user",
                "content": f"Dame recomendaciones de itinerarios en {lugar}. Quiero que lo hagas MUY resumido y que respondas directamente y en español."
            }
        ],
    }

    response = requests.post(url, headers=headers, json=data)

    if response.status_code != 200:
        return {"Error en la peticion": response.content}
    
    return Response(response.content, content_type=response.headers['Content-Type'])

if __name__ == '__main__':
    app.run(debug=True)
