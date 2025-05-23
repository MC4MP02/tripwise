import { useEffect, useRef, useState } from "react";

const PLACE_TYPES = [
  { type: "restaurant", label: "🍽️ Restaurantes" },
  { type: "hotel", label: "🏨 Hoteles" },
  { type: "parking", label: "🅿️ Parkings" },
];

export default function MapWithPlaces({ destination }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState(["restaurant", "hotel", "parking"]);
  const [markers, setMarkers] = useState([]);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [textoIA, setTextoIA] = useState("");
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (!map || !window.google) return;

    markers.forEach((m) => m.setMap(null));
    setMarkers([]);

    const service = new window.google.maps.places.PlacesService(map);

    selectedTypes.forEach((type) => {
      const request = {
        location: map.getCenter(),
        radius: 1500,
        type,
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

  const handleCheckboxChange = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleToggleResumen = async () => {
    setLoading(true);
    const textoSimulado = await fetch(`http://localhost:5000/api/ia?lugar=${encodeURIComponent(destination)}`);
    const dataSimulado = await textoSimulado.json();
    console.log(dataSimulado);
    setTextoIA(dataSimulado["choices"][0]["message"]["content"]);
    setMostrarResumen(true);
    setLoading(false);
  };


  return (
    <div className="flex flex-col items-center w-full">
      {!loading && (
        <button onClick={handleToggleResumen}
        className="bg-blue-500 text-white p-2 rounded cursor-pointer hover:scale-110 hover:bg-blue-600 trasition-all duration-300"> 
          Generar itinerario
        </button>
      )}
      {loading && (
        <div className="loader"></div>
      )}
      <div className="flex flex-row items-center w-full justify-center">
        <div className={`flex flex-col items-center justify-center gap-4 my-4 ${mostrarResumen ? "w-1/2" : "w-full"}`}>
          <div className={`flex gap-4 my-4`}>
            {PLACE_TYPES.map(({ type, label }) => (
              <label key={type} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => handleCheckboxChange(type)}
                  />
                {label}
              </label>
            ))}
          </div>

          <div ref={mapRef} style={{ width: "100%", height: "300px" }} />
        </div>
         {mostrarResumen && (
          <div className="w-1/2 p-6 bg-gray-100 border-l border-gray-300 overflow-auto">
            <h2 className="text-xl font-semibold mb-4">Itinerario sugerido</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{textoIA}</p>
          </div>
        )}
      </div>


    </div>
  );
}
