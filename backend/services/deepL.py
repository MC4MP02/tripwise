import os
import requests
from dotenv import load_dotenv


load_dotenv()

def translate_text(text: str, target_lang: str = "EN"):
    api_key = os.getenv("DEEPL_API_KEY")
    url = "https://api-free.deepl.com/v2/translate"
    headers = {
        "Authorization": f"DeepL-Auth-Key {api_key}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    data = {
        "text": text,
        "target_lang": target_lang.upper()
    }
    response = requests.post(url, data=data, headers=headers)
    return response.json()


