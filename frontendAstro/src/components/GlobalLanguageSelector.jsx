import { useState, useEffect } from 'react';

const API_URL = "https://europe-west1-valid-unfolding-461111-m1.cloudfunctions.net/tripwise-backend";

export default function GlobalLanguageSelector({ currentLanguage, onLanguageChange }) {
  const [languages, setLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
      }
    };

    fetchLanguages();
  }, []);

  return (
    <div className="fixed top-4 right-4 flex items-center gap-2 bg-white/90 p-2 rounded-lg shadow-md z-50">      <select
        className="p-2 border rounded-md text-sm"
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
