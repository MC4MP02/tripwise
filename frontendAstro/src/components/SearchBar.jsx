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
        `${API_URL}/api/translate?text=${encodeURIComponent(wiki)}&lang=${language}`
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
    <div className='w-full max-w-full overflow-x-hidden'>
      {!lugar ? (
        // Vista inicial centrada
        <div className="flex flex-col items-center justify-center min-h-[90vh] px-4">          <div className="text-center mb-6 flex flex-col items-center">
            <h1 className="text-3xl md:text-4xl text-black">Travel Planner</h1>
            <img 
              src="assets/tripwise_logo.png" 
              alt="tripwise_logo" 
              className="w-[10em] h-auto mx-auto mt-7 mb-2" 
              style={{ fontSize: 'inherit' }}
            />
          </div>
            <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
            <input
              ref={inputRef}
              className='w-full border-2 border-gray-300 rounded-md p-3 text-lg shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              type="text"
              placeholder="Introduce un destino"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button 
              type="submit"
              className='w-full px-6 py-3 text-lg cursor-pointer rounded-xl border-2 border-blue-600 hover:scale-105 bg-blue-500 hover:bg-blue-600 font-semibold text-white transition-all shadow-md mt-2'
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full px-4 md:px-6 lg:px-8">
          {/* Barra de búsqueda en la parte superior */}
          <div className="w-full max-w-2xl mx-auto pt-4 pb-6">
            <SearchForm 
              inputRef={inputRef}
              query={query}
              setQuery={setQuery}
              loading={loading}
              handleSubmit={handleSubmit}
              className="flex flex-row gap-2 items-center"
            />
          </div>

          <div className='w-full max-w-5xl mx-auto'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
              {/* Información del lugar */}
              <div className='bg-white p-3 rounded-lg shadow-md'>
                <h2 className="text-lg font-semibold mb-2">{lugar.nombre}</h2>
                <p className="text-sm mb-1">📍 {lugar.direccion}</p>
                <p className="text-sm mb-1">📌 Tipo: {formatearTipos(lugar.tipos)}</p>
                {lugar.rating && (<p className="text-sm mb-2">⭐ Valoración: {lugar.rating}</p>)}
                {lugar.foto_ref && (
                  <div className='flex justify-center mt-2'>
                    <img 
                      src={`${API_URL}/api/foto?photo_ref=${lugar.foto_ref}`} 
                      alt="Foto del lugar"
                      className="rounded-lg shadow-md w-full max-w-[200px] h-auto object-cover" 
                    />
                  </div>
                )}
              </div>

              {/* Wiki información */}
              {wiki && (
                <div className='bg-white p-3 rounded-lg shadow-md h-fit'>
                  <h2 className="text-lg font-semibold mb-2">Descripción</h2>
                  <div className='prose prose-sm'>
                    <p className="text-sm text-gray-700">{translatedWiki || wiki}</p>
                  </div>
                </div>
              )}

              {/* Información del clima */}
              {clima && (
                <div className='bg-white p-3 rounded-lg shadow-md h-fit'>
                  <h2 className="text-lg font-semibold mb-3">Clima</h2>
                  <div className='space-y-1 text-sm'>
                    <p>🌡️ {clima.temperatura}°C - {clima.descripcion}</p>
                    <p>🌧️ Lluvia: {clima.lluvia ? 'Si' : 'No'}</p>
                    <p>💧 Humedad: {clima.humedad}%</p>
                    <p>💨 Viento: {clima.viento} km/h</p>
                    <p>🥵 Sensación: {clima.sensacion_unidad}ºC - {clima.sensacion}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {lugar && (
            <div className='w-full max-w-5xl mx-auto'>
              <MapWithPlaces
                destination={lugar.nombre}
                client:load
                onLanguageChange={handleLanguageChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Componente SearchForm extraído para reutilización
function SearchForm({ inputRef, query, setQuery, loading, handleSubmit, className }) {
  return (
    <form onSubmit={handleSubmit} className={`${className}`}>
      <input
        ref={inputRef}
        className='flex-1 border-2 border-gray-300 rounded-md p-2 text-base shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        type="text"
        placeholder="Introduce un destino"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button 
        type="submit"
        className='px-6 py-2 text-base cursor-pointer rounded-xl border-2 border-blue-600 hover:scale-105 bg-blue-500 hover:bg-blue-600 font-semibold text-white transition-all shadow-md whitespace-nowrap'
      >
        {loading ? "Buscando..." : "Buscar"}
      </button>
    </form>
  );
}
