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

        const service = new window.google.maps.places.PlacesService(newMap);
        service.nearbySearch(
          {
            location,
            radius: 1500,
            type: "restaurant | hotel | parking",
          },
          (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              results.forEach((place) => {
                const marker = new window.google.maps.Marker({
                  map: newMap,
                  position: place.geometry.location,
                  title: place.name,
                });

                marker.addListener("click", () => {
                  infowindow.setContent(`
                    <div>
                      <strong>${place.name}</strong><br/>
                      ${place.vicinity || ""}
                    </div>
                  `);
                  infowindow.open(newMap, marker);
                });
              });
            }
          }
        );
      } else {
        console.error("Error geocoding location:", status);
      }
    });
  }, [destination]);

  const handleCheckboxChange = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
        <div>
            {PLACE_TYPES.map(({ type, label }) => (
                <label key={type} style={{ marginRight: "1rem" }}>
                    <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => handleCheckboxChange(type)}
                    />
                    {label}
                </label>
            ))}
        </div>
        <div
        ref={mapRef}
        style={{ width: "100%", height: "300px", borderRadius: "12px", paddingTop: "1rem" }}
        />
    </div>
  );
}
