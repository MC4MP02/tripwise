from flask import Flask, request, jsonify, Response
import functions_framework
from services.google_places import get_places
from services.weather import get_weather
from services.deepL import translate_text

@functions_framework.http
def tripwise_backend(request):
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
