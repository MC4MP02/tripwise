import { useEffect, useRef, useState } from "react";
import GlobalLanguageSelector from "./GlobalLanguageSelector";

const PLACE_TYPES = [
  { type: "restaurant", label: "🍽️ Restaurantes" },
  { type: "hotel", label: "🏨 Hoteles" },
  { type: "parking", label: "🅿️ Parkings" },
];

const DEFAULT_TEXTS = {
  ES: {
    generate: "Generar itinerario",
    generating: "Generando...",
    suggestedItinerary: "Itinerario sugerido"
  }
};

const API_URL = "https://europe-west1-valid-unfolding-461111-m1.cloudfunctions.net/tripwise-backend";

export default function MapWithPlaces({ destination, onLanguageChange }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState(["restaurant", "hotel", "parking"]);
  const [markers, setMarkers] = useState([]);
  const [textoIA, setTextoIA] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("ES");
  const [loading, setLoading] = useState(false);  const [translating, setTranslating] = useState(false);
  const [translatedTexts, setTranslatedTexts] = useState({
    itinerary: "",
    placeTypes: PLACE_TYPES,
    buttons: DEFAULT_TEXTS.ES
  });

  // Reset textoIA when destination changes
  useEffect(() => {
    setTextoIA("");
  }, [destination]);

  // Inicializar el mapa
  useEffect(() => {
    if (!window.google || !destination) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: destination }, (results, status) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        const newMap = new window.google.maps.Map(mapRef.current, {
          center: location,
          zoom: 14,
        });

        const infowindow = new window.google.maps.InfoWindow();
        setMap(newMap);
        setInfoWindow(infowindow);
      } else {
        console.error("Error geocoding location:", status);
      }
    });
  }, [destination]);

  // Actualizar marcadores
  useEffect(() => {
    if (!map || !window.google) return;

    markers.forEach((m) => m.setMap(null));
    setMarkers([]);

    const service = new window.google.maps.places.PlacesService(map);

    selectedTypes.forEach((type) => {
      const request = {
        location: map.getCenter(),
        radius: 1500,
        type: type
      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const newMarkers = results.map((place) => {
            const marker = new window.google.maps.Marker({
              map,
              position: place.geometry.location,
              title: place.name,
            });

            marker.addListener("click", () => {
              infoWindow.setContent(`
                <div>
                  <strong>${place.name}</strong><br/>
                  ${place.vicinity || ""}
                </div>
              `);
              infoWindow.open(map, marker);
            });

            return marker;
          });

          setMarkers((prev) => [...prev, ...newMarkers]);
        }
      });
    });
  }, [selectedTypes, map]);

  const translateContent = async (text, type) => {
    if (!text || currentLanguage === "ES") return;
    
    try {
      setTranslating(true);
      const response = await fetch(
        `${API_URL}/api/translate?text=${encodeURIComponent(text)}&lang=${currentLanguage}`
      );
      const data = await response.json();
      setTranslatedTexts(prev => ({
        ...prev,
        [type]: data.translated_text || text
      }));
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setTranslating(false);
    }
  };

  const handleLanguageChange = async (newLanguage) => {
    if (newLanguage === currentLanguage) return;
    
    setTranslating(true);    setCurrentLanguage(newLanguage);
    onLanguageChange?.(newLanguage);

    if (newLanguage === "ES") {
      setTranslatedTexts({
        itinerary: textoIA,
        placeTypes: PLACE_TYPES,
        buttons: DEFAULT_TEXTS.ES
      });
      setTranslating(false);
      return;
    }    try {
      const translations = [];
      
      if (textoIA) {
        const response = await fetch(
          `${API_URL}/api/translate?text=${encodeURIComponent(textoIA)}&lang=${newLanguage}`
        );
        const data = await response.json();
        setTranslatedTexts(prev => ({
          ...prev,
          itinerary: data.translated_text || textoIA
        }));
      }      const buttonTexts = DEFAULT_TEXTS.ES;
      Object.entries(buttonTexts).forEach(([key, text]) => {
        translations.push(
          fetch(`${API_URL}/api/translate?text=${encodeURIComponent(text)}&lang=${newLanguage}`)
            .then(res => res.json())
            .then(data => ({ type: 'button', key, text: data.translated_text || text }))
        );
      });

      // Preparar traducciones de tipos de lugares
      PLACE_TYPES.forEach((type) => {
        translations.push(
          fetch(`${API_URL}/api/translate?text=${encodeURIComponent(type.label.split(' ')[1])}&lang=${newLanguage}`)
            .then(res => res.json())
            .then(data => ({ 
              type: 'placeType', 
              originalType: type,
              text: data.translated_text || type.label.split(' ')[1]
            }))
        );
      });


      const results = await Promise.all(translations);      
      const translatedButtons = {};
      for (const [key, text] of Object.entries(buttonTexts)) {
        const response = await fetch(
          `${API_URL}/api/translate?text=${encodeURIComponent(text)}&lang=${newLanguage}`
        );
        const data = await response.json();
        translatedButtons[key] = data.translated_text || text;
      }

      // Traducir tipos de lugares
      const translatedTypes = await Promise.all(
        PLACE_TYPES.map(async (type) => {
          const response = await fetch(
            `${API_URL}/api/translate?text=${encodeURIComponent(type.label.split(' ')[1])}&lang=${newLanguage}`
          );
          const data = await response.json();
          return {
            ...type,
            label: `${type.label.split(' ')[0]} ${data.translated_text || type.label.split(' ')[1]}`
          };
        })
      );      setTranslatedTexts(prev => ({
        ...prev,
        placeTypes: translatedTypes,
        buttons: translatedButtons
      }));
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setTranslating(false);
    }
  };

  const handleCheckboxChange = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleToggleResumen = async () => {
    setLoading(true);
    try {
      const textoSimulado = await fetch(`${API_URL}/api/ia?lugar=${encodeURIComponent(destination)}`);
      const dataSimulado = await textoSimulado.json();
      const itineraryText = dataSimulado.choices[0].message.content;
      setTextoIA(itineraryText);

      if (currentLanguage !== "ES") {
        const response = await fetch(
          `${API_URL}/api/translate?text=${encodeURIComponent(itineraryText)}&lang=${currentLanguage}`
        );
        const data = await response.json();
        setTranslatedTexts(prev => ({
          ...prev,
          itinerary: data.translated_text || itineraryText
        }));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col items-center w-full max-w-full">
      <div className="absolute top-4 right-4 z-50">
        <GlobalLanguageSelector
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
      </div>

      {/* Botón generar itinerario */}
      <div className="w-full flex justify-center mb-4">
        {!loading ? (
          <button 
            onClick={handleToggleResumen}
            className="px-6 py-2 bg-blue-500 text-white text-sm rounded cursor-pointer hover:bg-blue-600 transition-all duration-300"
            disabled={loading}
          > 
            {loading ? translatedTexts.buttons.generating : translatedTexts.buttons.generate}
          </button>
        ) : (
          <div className="loader scale-75"></div>
        )}
      </div>      {/* Layout principal: Filtros + Mapa + Itinerario */}
      <div className="w-full flex flex-col lg:flex-row gap-4">
        {/* Contenedor para filtros y mapa */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4">
          {/* Filtros para escritorio */}
          <div className="hidden lg:flex flex-col justify-center gap-2">
            {translatedTexts.placeTypes.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => handleCheckboxChange(type)}
                className={`px-3 py-2 text-sm rounded transition-colors whitespace-nowrap ${
                  selectedTypes.includes(type)
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Contenedor de filtros móviles y mapa */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Filtros móviles */}
            <div className="flex lg:hidden flex-wrap gap-2 justify-center">
              {translatedTexts.placeTypes.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => handleCheckboxChange(type)}
                  className={`px-3 py-2 text-sm rounded transition-colors ${
                    selectedTypes.includes(type)
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>            {/* Mapa */}
            <div className="w-full">
              <div 
                ref={mapRef} 
                className="w-full h-[350px] rounded-lg shadow-md" 
              />
            </div>
          </div>
        </div>

        {/* Itinerario */}
        {textoIA && (
          <div className="lg:w-2/5 flex flex-col">
            <div className="bg-white rounded-lg shadow-md h-[350px] overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b bg-white">
                <h2 className="text-lg font-semibold">
                  {translatedTexts.buttons.suggestedItinerary}
                </h2>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {translatedTexts.itinerary || textoIA}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
