import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';

const WeatherContext = createContext(null);

export function WeatherProvider({ children, defaultCity = '' }) {
  const [city, setCity] = useState(() => {
    try {
      const saved = sessionStorage.getItem('currentCity') || localStorage.getItem('lastCity');
      return saved || defaultCity;
    } catch {
      return defaultCity;
    }
  });
  const [useGps, setUseGps] = useState(() => {
    try {
      const sessionGps = sessionStorage.getItem('useGps');
      if (sessionGps !== null) return sessionGps === '1';
      return localStorage.getItem('useGps') === '1';
    } catch {
      return false;
    }
  });
  const [prevCity, setPrevCity] = useState(() => {
    try { return localStorage.getItem('prevCity') || 'Hanoi'; } catch { return 'Hanoi'; }
  });
  const { coords, permission, startWatch, stopWatch } = useGeolocation();

  // Save to both session and local storage
  useEffect(() => {
    try {
      sessionStorage.setItem('currentCity', city);
      if (city) localStorage.setItem('lastCity', city);
    } catch {}
  }, [city]);

  useEffect(() => {
    try {
      sessionStorage.setItem('useGps', useGps ? '1' : '0');
      localStorage.setItem('useGps', useGps ? '1' : '0');
    } catch {}
    if (useGps && permission !== 'denied') startWatch();
    if (!useGps) stopWatch();
  }, [useGps, permission, startWatch, stopWatch]);

  // Remember last typed city when enabling GPS, and restore when disabling
  useEffect(() => {
    if (useGps) {
      if (city) {
        setPrevCity(city);
        try { localStorage.setItem('prevCity', city); } catch {}
      }
    } else if (!city) {
      // Only restore if no city is set
      setCity(prevCity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useGps]);

  const value = useMemo(() => ({ city, setCity, coords, permission, startWatch, stopWatch, useGps, setUseGps }), [city, coords, permission, startWatch, stopWatch, useGps]);
  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeatherContext() {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeatherContext must be used within WeatherProvider');
  return ctx;
}
