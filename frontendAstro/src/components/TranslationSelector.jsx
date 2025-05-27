import { useState, useEffect } from 'react';

const API_URL = "https://europe-west1-valid-unfolding-461111-m1.cloudfunctions.net/tripwise-backend";

export default function TranslationSelector({ text, onTranslated }) {
  const [languages, setLanguages] = useState([]);
  const [selectedLang, setSelectedLang] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch(`${API_URL}/api/languages`);
        const data = await response.json();
        const languagesList = Object.entries(data).map(([code, name]) => ({
          code,
          name
        }));
        setLanguages(languagesList.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error('Error fetching languages:', error);
        setError('Error cargando idiomas disponibles');
      }
    };

    fetchLanguages();
  }, []);

  const handleTranslate = async () => {
    if (!selectedLang) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/translate?text=${encodeURIComponent(text)}&lang=${selectedLang}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else if (data.translated_text) {
        onTranslated(data.translated_text);
      }
    } catch (error) {
      console.error('Error translating:', error);
      setError('Error al traducir el texto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <select
          className="p-2 border rounded-md flex-grow"
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
        >
          <option value="">Seleccionar idioma</option>
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleTranslate}
          disabled={!selectedLang || isLoading}
          className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Traduciendo...' : 'Traducir'}
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
