import { useState } from 'react';


export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [lugar, setLugar] = useState(null);
  const [clima, setClima] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wiki, setWiki] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault();    
    if (!query) return;

    setLoading(true);

    try {
      // Llamada al backend: info del lugar
      const resLugar = await fetch(`http://localhost:5000/api/places?destination=${encodeURIComponent(query)}`);
      const dataLugar = await resLugar.json();
      setLugar(dataLugar);

      // Llamada al backend: wiki
      const resWiki = await fetch(`http://localhost:5000/api/wiki?lugar=${encodeURIComponent(dataLugar["nombre"])}`)
      const dataWiki = await resWiki.json();
      setWiki(dataWiki)

      // Llamada al backend: clima
      const resClima = await fetch(`http://localhost:5000/api/weather?city=${encodeURIComponent(query)}`);
      const dataClima = await resClima.json();
      setClima(dataClima);

    } catch (err) {
      console.error("Error al buscar:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <form onSubmit={handleSubmit} className='gap-4 flex justify-center'>
        <input
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
       <div className='flex flex-col items-center justify-center w-screen gap-x-4 mt-5'>
          {lugar && (<h1 className='text-3xl mb-8'>Información del destino</h1>)}
          <div className='flex flex-row items-center justify-center w-full gap-x-10'>
            <div>
              {lugar && (
                <div>
                  <h2>{lugar.nombre}</h2>
                  <p>📍 {lugar.direccion}</p>
                  <p>📌 Tipo: {lugar.tipos[0]}</p>
                  {lugar.foto_ref && (
                    <img src={`http://localhost:5000/api/foto?photo_ref=${lugar.foto_ref}`} alt="Foto del lugar"
                    className="rounded shadow w-52 h-auto" />                
                  )}
                </div>
              )}
            </div>
            {wiki && (
              <div className='max-w-80'>
                {wiki["extract"]}
              </div>
            )}
          </div>

          <div className='flex flex-col items-center justify-center w-full'>
            {clima && (<h1 className='text-3xl'>Información del clima actual</h1>)}
            {clima && (
              <div>
                <p>🌡️ {clima.temperatura}°C - {clima.descripcion}</p>
                <p>🌧️ Lluvia: {clima.lluvia ? 'Si' : 'No'}</p>
                <p>💧 Humedad: {clima.humedad}%</p>
                <p>💨 Viento: {clima.viento} km/h</p>
                <p>🥵 Sensacion: {clima.sensacion_unidad}ºC - {clima.sensacion}</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
