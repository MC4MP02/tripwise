import { useState, useEffect, useRef } from 'react';
import MapWithPlaces from './MapWithPlaces.jsx';

const API_URL = "https://europe-west1-valid-unfolding-461111-m1.cloudfunctions.net/tripwise-backend";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [lugar, setLugar] = useState(null);
  const [clima, setClima] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wiki, setWiki] = useState(null);
  const [translatedWiki, setTranslatedWiki] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState("ES");

  const inputRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.google?.maps?.places?.Autocomplete && inputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: [],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          setQuery(place.name);
        });

        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (wiki && currentLanguage !== "ES") {
      translateWiki(currentLanguage);
    } else if (currentLanguage === "ES") {
      setTranslatedWiki(null);
    }
  }, [wiki, currentLanguage]);

  const translateWiki = async (language) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/translate?text=${encodeURIComponent(wiki)}&lang=${language}`
      );
      const data = await response.json();
      setTranslatedWiki(data.translated_text);
    } catch (error) {
      console.error('Error translating wiki:', error);
    }
  };

  const handleLanguageChange = async (newLanguage) => {
    setCurrentLanguage(newLanguage);
    if (newLanguage === "ES") {
      setTranslatedWiki(null);
    } else if (wiki) {
      await translateWiki(newLanguage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();    
    if (!query) return;

    setLoading(true);
    setTranslatedWiki(null);

    try {
      // Llamada al backend: info del lugar
      const resLugar = await fetch(`${API_URL}/api/places?destination=${encodeURIComponent(query)}`);
      const dataLugar = await resLugar.json();
      setLugar(dataLugar);

      // Llamada al backend: wiki
      const resWiki = await fetch(`${API_URL}/api/wiki?lugar=${encodeURIComponent(dataLugar["nombre"].normalize("NFD").replace(/[\u0300-\u036f]/g, ""))}`);
      const dataWiki = await resWiki.json();
      setWiki(dataWiki.extract);

      // Si el idioma actual no es español, traducir inmediatamente
      if (currentLanguage !== "ES") {
        await translateWiki(currentLanguage);
      }

      // Llamada al backend: clima
      const resClima = await fetch(`${API_URL}/api/weather?city=${encodeURIComponent(query)}`);
      const dataClima = await resClima.json();
      setClima(dataClima);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  function formatearTipos(tipos) {
    if (!tipos || !tipos.length) return "";

    return tipos
      .map((tipo, index) => {
        if (index < 4) {
          tipo = tipo.replace(/_/g, " ");
          return tipo.charAt(0).toUpperCase() + tipo.slice(1);
        }
      })
      .join(", ");
  }

  return (
    <div className='w-full'>
      {!lugar && (
        <header>
          <div className="flex flex-col items-center justify-center w-full p-5 text-white rounded-2xl">
            <h1 className="text-4xl text-black">Travel Planner</h1>
            <img src="assets/tripwise_logo.png" alt="tripwise_logo" className="w-[100px] h-auto pt-[10px]" />
          </div>
        </header>
      )}
      <div className="flex flex-col items-center justify-center w-full px-20">
        <form onSubmit={handleSubmit} className='gap-4 flex flex-col justify-center items-center'>
          <input
            ref={inputRef}
            className='border-2 border-gray-300 rounded-md p-2'
            type="text"
            placeholder="Introduce un destino"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            />
          <button 
            type="submit"
            className='cursor-pointer rounded-2xl p-2 border-2 border-blue-600 hover:scale-105 bg-blue-400 font-semibold text-white'
            >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>
        {!loading && lugar && (
            <div className='flex flex-row items-start justify-between w-[70%] h-full gap-x-10 relative pt-6'>
              <div className='flex h-full flex-col'>
                <h2>{lugar.nombre}</h2>
                <p>📍 {lugar.direccion}</p>
                <p>📌 Tipo: {formatearTipos(lugar.tipos)}</p>
                {lugar.rating && (<p>⭐ Valoración: {lugar.rating}</p>)}
                <div className='flex w-full items-center justify-center'>
                  {lugar.foto_ref && (
                    <img src={`${API_URL}/api/foto?photo_ref=${lugar.foto_ref}`} alt="Foto del lugar"
                    className="rounded shadow w-52 h-auto max-h-52 mt-8" />                
                  )}
                </div>
              </div>

              {wiki && (
                <div className='max-w-[450px] h-full flex flex-col'>
                  {translatedWiki || wiki}
                </div>
              )}

              {clima && (
                <div className='h-full flex flex-col justify-center'>
                  <p>🌡️ {clima.temperatura}°C - {clima.descripcion}</p>
                  <p>🌧️ Lluvia: {clima.lluvia ? 'Si' : 'No'}</p>
                  <p>💧 Humedad: {clima.humedad}%</p>
                  <p>💨 Viento: {clima.viento} km/h</p>
                  <p>🥵 Sensacion: {clima.sensacion_unidad}ºC - {clima.sensacion}</p>
                </div>
                
              )}
            </div>

        
        )}

        {lugar && (
          <div className='flex w-full justify-center items-center pt-6'>
            <MapWithPlaces
              destination={lugar.nombre}
              client:load
              onLanguageChange={handleLanguageChange}
              />
          </div>
        )}

      </div>
  </div>
  );
}
