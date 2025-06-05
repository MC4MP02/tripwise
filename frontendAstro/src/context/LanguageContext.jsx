import { createContext, useContext, useState } from 'react';

const API_URL = "https://europe-west1-valid-unfolding-461111-m1.cloudfunctions.net/tripwise-backend";

// Traducciones por defecto para evitar mostrar claves sin traducir
const defaultTranslations = {
  'EN': {
    'Select language': 'Select language',
    'Translate': 'Translate',
    'Translating...': 'Translating...',
    'Restaurants': 'Restaurants',
    'Hotels': 'Hotels',
    'Parkings': 'Parkings',
    'Generate itinerary': 'Generate itinerary',
    'Generating...': 'Generating...',
    'Destination summary': 'Destination summary',
    'Weather report': 'Weather report',
    'Temperature': 'Temperature',
  },
  'ES': {
    'Select language': 'Seleccionar idioma',
    'Translate': 'Traducir',
    'Translating...': 'Traduciendo...',
    'Restaurants': 'Restaurantes',
    'Hotels': 'Hoteles',
    'Parkings': 'Aparcamientos',
    'Generate itinerary': 'Generar itinerario',
    'Generating...': 'Generando...',
    'Destination summary': 'Resumen del destino',
    'Weather report': 'Informe del tiempo',
    'Temperature': 'Temperatura',
  }
};

const LanguageContext = createContext();

// Proveedor del contexto de idioma para toda la aplicación
export function LanguageProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState('ES');
  const [translations, setTranslations] = useState(defaultTranslations);

  // Función para obtener una traducción específica por clave
  const translate = (key) => {
    return translations[currentLanguage]?.[key] || translations['EN'][key] || key;
  };

  // Traducir múltiples textos usando la API de DeepL
  const translateAll = async (texts) => {
    if (currentLanguage === 'ES') return texts;
    
    const translatedTexts = {};
    // Traducir cada texto individualmente
    for (const [key, text] of Object.entries(texts)) {
      try {
        const response = await fetch(`${API_URL}/api/translate?text=${encodeURIComponent(text)}&lang=${currentLanguage}`);
        const data = await response.json();
        translatedTexts[key] = data.translated_text || text;
      } catch (error) {
        console.error('Translation error:', error);
        translatedTexts[key] = text;
      }
    }
    return translatedTexts;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setCurrentLanguage, translate, translateAll }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook personalizado para usar el contexto de idioma
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
