from flask import Flask, request, jsonify, Response
import functions_framework
import requests
from functools import wraps
import traceback
import os

from services.google_places import get_places
from services.weather import get_weather
from services.deepL import translate_text, get_supported_languages

# Verificar variables de entorno requeridas
REQUIRED_ENV_VARS = {
    "GOOGLE_API_KEY": os.environ.get("GOOGLE_API_KEY"),
    "OPENROUTER_API_KEY": os.environ.get("OPENROUTER_API_KEY"),
    "DEEPL_API_KEY": os.environ.get("DEEPL_API_KEY"),
    "ACCUWEATHER_API_KEY": os.environ.get("ACCUWEATHER_API_KEY")
}

# Log warning instead of raising error in production
missing_vars = [var for var, value in REQUIRED_ENV_VARS.items() if not value]
if missing_vars:
    print(f"Warning: Missing environment variables: {', '.join(missing_vars)}")

GOOGLE_API_KEY = REQUIRED_ENV_VARS["GOOGLE_API_KEY"]
OPENROUTER_API_KEY = REQUIRED_ENV_VARS["OPENROUTER_API_KEY"]

def handle_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except requests.exceptions.RequestException as e:
            print(f"Request error in {f.__name__}: {str(e)}")
            return jsonify({"error": str(e)}), 500
        except Exception as e:
            print(f"Error in {f.__name__}: {str(e)}\n{traceback.format_exc()}")
            return jsonify({"error": "Internal server error"}), 500
    return wrapper

@functions_framework.http
def tripwise_backend(request):
    # CORS headers
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    headers = {
        'Access-Control-Allow-Origin': '*'
    }

    # Get the path from the request URL
    path = request.path
    if path.startswith('/'):
        path = path[1:]  # Remove leading slash

    try:
        if path == 'api/places':
            destination = request.args.get('destination')
            return (jsonify(get_places(destination)), 200, headers)
        
        elif path == 'api/weather':
            city = request.args.get('city')
            return (jsonify(get_weather(city)), 200, headers)
        
        elif path == 'api/translate':
            text = request.args.get('text')
            lang = request.args.get('lang', 'EN')
            return (jsonify(translate_text(text, lang)), 200, headers)
        
        elif path == 'api/languages':
            return (jsonify(get_supported_languages()), 200, headers)
        
        elif path == 'api/ia':
            lugar = request.args.get('lugar')
            if not lugar:
                return (jsonify({"error": "Falta el Lugar"}), 400, headers)
            
            url = "https://openrouter.ai/api/v1/chat/completions"
            api_headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
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
            response = requests.post(url, headers=api_headers, json=data)
            response.raise_for_status()
            return (response.json(), 200, headers)
        
        elif path == 'api/foto':
            photo_ref = request.args.get("photo_ref")
            if not photo_ref:
                return (jsonify({"error": "Falta el parámetro photo_reference"}), 400, headers)
            
            url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photo_reference={photo_ref}&key={GOOGLE_API_KEY}"
            response = requests.get(url, stream=True)
            response.raise_for_status()
            return (response.content, 200, {'Content-Type': response.headers.get('Content-Type', 'image/jpeg'), **headers})
        
        elif path == 'api/wiki':
            lugar = request.args.get('lugar')
            if not lugar:
                return (jsonify({"error": "Falta el Lugar"}), 400, headers)
            
            lugar_encoded = requests.utils.quote(lugar)
            url = f"https://es.wikipedia.org/api/rest_v1/page/summary/{lugar_encoded}"
            response = requests.get(url)
            response.raise_for_status()
            return (response.content, 200, {'Content-Type': response.headers['Content-Type'], **headers})
        
        else:
            return (jsonify({"error": "Ruta no encontrada"}), 404, headers)
            
    except requests.exceptions.RequestException as e:
        return (jsonify({"error": str(e)}), 500, headers)
    except Exception as e:
        print(f"Error: {str(e)}\n{traceback.format_exc()}")
        return (jsonify({"error": "Error interno del servidor"}), 500, headers)
    # Configurar CORS
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    headers = {'Access-Control-Allow-Origin': '*'}

    # Rutas
    path = request.path
    if path.startswith('/'):
        path = path[1:]

    if path == 'api/places':
        destination = request.args.get('destination')
        return (jsonify(get_places(destination)), 200, headers)

    elif path == 'api/weather':
        city = request.args.get('city')
        return (jsonify(get_weather(city)), 200, headers)

    elif path == 'api/translate':
        text = request.args.get('text')
        lang = request.args.get('lang', 'EN')
        return (jsonify(translate_text(text, lang)), 200, headers)

    elif path == 'api/languages':
        return (jsonify(translate_text.SUPPORTED_LANGUAGES), 200, headers)

    elif path == 'api/foto':
        photo_ref = request.args.get("photo_ref")
        if not photo_ref:
            return ("Falta el parámetro photo_reference", 400, headers)
        
        url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photo_reference={photo_ref}&key={GOOGLE_API_KEY}"
        response = requests.get(url, stream=True)
        
        if response.status_code != 200:
            return ("No se pudo obtener la imagen", 500, headers)
        
        return (response.content, 200, {'Content-Type': response.headers['Content-Type'], **headers})

    elif path == 'api/wiki':
        lugar = request.args.get('lugar')
        if not lugar:
            return ("Falta el Lugar", 400, headers)
        
        url = f"https://es.wikipedia.org/api/rest_v1/page/summary/{lugar}"
        response = requests.get(url)
        
        if response.status_code != 200:
            return ("Error en la peticion", 500, headers)
        
        return (response.content, 200, {'Content-Type': response.headers['Content-Type'], **headers})

    elif path == 'api/ia':
        lugar = request.args.get('lugar')
        if not lugar:
            return ("Falta el Lugar", 400, headers)
        
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers_ia = {
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
        
        response = requests.post(url, headers=headers_ia, json=data)
        
        if response.status_code != 200:
            return ({"Error en la peticion": response.content}, 500, headers)
        
        return (response.content, 200, {'Content-Type': response.headers['Content-Type'], **headers})

    return ('Not Found', 404, headers)
