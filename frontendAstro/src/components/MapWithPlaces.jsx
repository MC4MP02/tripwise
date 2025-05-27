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
    }    try {
      const translations = [];
      
      if (textoIA) {
        translations.push(
          fetch(`http://localhost:5000/api/translate?text=${encodeURIComponent(textoIA)}&lang=${newLanguage}`)
            .then(res => res.json())
            .then(data => ({ type: 'itinerary', text: data.translated_text || textoIA }))
        );
      }

      const buttonTexts = DEFAULT_TEXTS.ES;
      Object.entries(buttonTexts).forEach(([key, text]) => {
        translations.push(
          fetch(`http://localhost:5000/api/translate?text=${encodeURIComponent(text)}&lang=${newLanguage}`)
            .then(res => res.json())
            .then(data => ({ type: 'button', key, text: data.translated_text || text }))
        );
      });

      // Preparar traducciones de tipos de lugares
      PLACE_TYPES.forEach((type) => {
        translations.push(
          fetch(`http://localhost:5000/api/translate?text=${encodeURIComponent(type.label.split(' ')[1])}&lang=${newLanguage}`)
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
      const translatedTypes = [...PLACE_TYPES];
      let translatedItinerary = textoIA;

      results.forEach(result => {
        if (result.type === 'button') {
          translatedButtons[result.key] = result.text;
        } else if (result.type === 'placeType') {
          const index = PLACE_TYPES.findIndex(t => t.type === result.originalType.type);
          if (index !== -1) {
            translatedTypes[index] = {
              ...result.originalType,
              label: `${result.originalType.label.split(' ')[0]} ${result.text}`
            };
          }
        } else if (result.type === 'itinerary') {
          translatedItinerary = result.text;
        }
      });      setTranslatedTexts({
        itinerary: translatedItinerary,
        placeTypes: translatedTypes,
        buttons: translatedButtons
      });
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
    <div className="flex flex-col items-center w-full">
      <div className="fixed top-4 right-4 z-50">
        <GlobalLanguageSelector
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
      </div>      {!loading && (
        <button 
          onClick={handleToggleResumen}
          className="bg-blue-500 text-white p-2 rounded cursor-pointer hover:scale-110 hover:bg-blue-600 transition-all duration-300"
          disabled={loading}
        > 
          {loading ? translatedTexts.buttons.generating : translatedTexts.buttons.generate}
        </button>
      )}
      {loading && (
        <div className="loader"></div>
      )}      <div className="flex flex-row items-center w-full justify-center gap-5">
        <div className={`flex flex-col items-center justify-center gap-4 my-4 ${textoIA ? "w-1/2" : "w-full"}`}>
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

          <div ref={mapRef} style={{ width: "100%", height: "500px" }} />
        </div>        {textoIA && (
          <div className="w-1/2 p-6 bg-white border-l border-gray-300 overflow-auto rounded shadow">
            <h2 className="text-xl font-semibold mb-4">{translatedTexts.buttons.suggestedItinerary}</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {translatedTexts.itinerary || textoIA}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
