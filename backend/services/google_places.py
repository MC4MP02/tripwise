import os
import requests

def get_places(destination: str):
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Warning: GOOGLE_API_KEY not set")
        return []

    # Es de pago pero tiene un "plan gratuito" MIRAR BIEN
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json" 
    params = {
        "query": destination,
        "key": api_key
    }
    response = requests.get(url, params=params)
    data = response.json()

    if data.get("status") != "OK":
        print("Error de Google Places:", data.get("status"), data.get("error_message"))
        return None
    
    if data["results"]:
        lugar = data["results"][0]
        resultado = {
            "nombre": lugar.get("name"),
            "direccion": lugar.get("formatted_address"),
            "rating": lugar.get("rating"),
            "tipos": lugar.get("types"),
            "lat": lugar.get("geometry", {}).get("location", {}).get("lat"),
            "lng": lugar.get("geometry", {}).get("location", {}).get("lng"),
            "place_id": lugar.get("place_id"),
            "business_status": lugar.get("business_status"),
            "foto_ref": lugar["photos"][0]["photo_reference"] if lugar.get("photos") else None
        }

        """ fotos = lugar.get("photos", [])
        if fotos:
            photo_reference = fotos[0].get("photo_reference")
            # Para obtener la imagen real necesitas montar la URL:
            img = requests.get(f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference={photo_reference}&key={api_key}")
            resultado["foto_url"] = img """

        return resultado

    return None


