from flask import Flask, request, jsonify

from services.google_places import get_places
from services.weather import get_weather
from services.deepL import translate_text

from dotenv import load_dotenv

from flask_cors import CORS

load_dotenv()

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

if __name__ == '__main__':
    app.run(debug=True)
