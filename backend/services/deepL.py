import os
import requests
from dotenv import load_dotenv
from typing import Dict, Union


load_dotenv()

SUPPORTED_LANGUAGES = {
    'BG': 'Bulgarian',
    'CS': 'Czech',
    'DA': 'Danish',
    'DE': 'German',
    'EL': 'Greek',
    'EN': 'English',
    'ES': 'Spanish',
    'ET': 'Estonian',
    'FI': 'Finnish',
    'FR': 'French',
    'HU': 'Hungarian',
    'ID': 'Indonesian',
    'IT': 'Italian',
    'JA': 'Japanese',
    'KO': 'Korean',
    'LT': 'Lithuanian',
    'LV': 'Latvian',
    'NB': 'Norwegian',
    'NL': 'Dutch',
    'PL': 'Polish',
    'PT': 'Portuguese',
    'RO': 'Romanian',
    'RU': 'Russian',
    'SK': 'Slovak',
    'SL': 'Slovenian',
    'SV': 'Swedish',
    'TR': 'Turkish',
    'UK': 'Ukrainian',
    'ZH': 'Chinese'
}

def get_supported_languages() -> Dict[str, str]:
    return SUPPORTED_LANGUAGES

def translate_text(text: str, target_lang: str = "EN") -> Dict[str, Union[str, dict]]:
    if not text:
        return {"error": "No text provided"}

    api_key = os.getenv("DEEPL_API_KEY")
    if not api_key:
        return {"error": "DeepL API key not found"}

    if target_lang not in SUPPORTED_LANGUAGES:
        return {"error": f"Unsupported language: {target_lang}"}

    url = "https://api-free.deepl.com/v2/translate"
    headers = {
        "Authorization": f"DeepL-Auth-Key {api_key}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    data = {
        "text": text,
        "target_lang": target_lang.upper()
    }
    
    try:
        response = requests.post(url, data=data, headers=headers)
        response.raise_for_status()
        result = response.json()
        return {
            "translated_text": result["translations"][0]["text"],
            "source_lang": result["translations"][0].get("detected_source_language", "unknown"),
            "target_lang": target_lang
        }
    except requests.RequestException as e:
        return {"error": f"Translation failed: {str(e)}"}
    except (KeyError, IndexError) as e:
        return {"error": f"Invalid response from DeepL API: {str(e)}"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}


