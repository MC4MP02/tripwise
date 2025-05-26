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
    translating: "Traduciendo...",
    weather: "Información del tiempo",
    temperature: "Temperatura",
    humidity: "Humedad",
    wind: "Viento",
    rain: "Lluvia"
  }
};

export default function MapWithPlaces({ destination, onLanguageChange }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState(["restaurant", "hotel", "parking"]);
  const [markers, setMarkers] = useState([]);
  const [textoIA, setTextoIA] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("ES");
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [translatedTexts, setTranslatedTexts] = useState({
    itinerary: "",
    placeTypes: PLACE_TYPES,
    buttons: DEFAULT_TEXTS.ES,
    weather: ""
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
        `http://localhost:5000/api/translate?text=${encodeURIComponent(text)}&lang=${currentLanguage}`
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
    }

    try {
      // Traducir textos existentes
      if (textoIA) {
        const response = await fetch(
          `http://localhost:5000/api/translate?text=${encodeURIComponent(textoIA)}&lang=${newLanguage}`
        );
        const data = await response.json();
        setTranslatedTexts(prev => ({
          ...prev,
          itinerary: data.translated_text || textoIA
        }));
      }

      // Traducir botones y etiquetas
      const buttonTexts = DEFAULT_TEXTS.ES;
      const translatedButtons = {};
      for (const [key, text] of Object.entries(buttonTexts)) {
        const response = await fetch(
          `http://localhost:5000/api/translate?text=${encodeURIComponent(text)}&lang=${newLanguage}`
        );
        const data = await response.json();
        translatedButtons[key] = data.translated_text || text;
      }

      // Traducir tipos de lugares
      const translatedTypes = await Promise.all(
        PLACE_TYPES.map(async (type) => {
          const response = await fetch(
            `http://localhost:5000/api/translate?text=${encodeURIComponent(type.label.split(' ')[1])}&lang=${newLanguage}`
          );
          const data = await response.json();
          return {
            ...type,
            label: `${type.label.split(' ')[0]} ${data.translated_text || type.label.split(' ')[1]}`
          };
        })
      );

      setTranslatedTexts(prev => ({
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
      const textoSimulado = await fetch(`http://localhost:5000/api/ia?lugar=${encodeURIComponent(destination)}`);
      const dataSimulado = await textoSimulado.json();
      const itineraryText = dataSimulado.choices[0].message.content;
      setTextoIA(itineraryText);

      if (currentLanguage !== "ES") {
        const response = await fetch(
          `http://localhost:5000/api/translate?text=${encodeURIComponent(itineraryText)}&lang=${currentLanguage}`
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
    <div className="flex flex-col md:flex-row gap-4 p-4">
      <div className="fixed top-4 right-4 z-50">
        <GlobalLanguageSelector
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
      </div>
        <div className="w-full md:w-3/4">
        <div ref={mapRef} style={{ height: "500px", width: "100%" }}></div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          {translatedTexts.placeTypes.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => handleCheckboxChange(type)}
              className={`px-4 py-2 rounded ${
                selectedTypes.includes(type)
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>      <div className="w-full md:w-1/4">
        {!textoIA && (
          <button
            onClick={handleToggleResumen}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded mb-4"
            disabled={loading || translating}
          >
            {loading ? translatedTexts.buttons.generating : 
             translating ? translatedTexts.buttons.translating :
             translatedTexts.buttons.generate}
          </button>
        )}

        {textoIA && (
          <div className="bg-white p-4 rounded shadow">
            <p className="mb-4 whitespace-pre-line">
              {translatedTexts.itinerary || textoIA}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
