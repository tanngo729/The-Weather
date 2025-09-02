import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';

const WeatherContext = createContext(null);

export function WeatherProvider({ children, defaultCity = 'Hanoi' }) {
  const [city, setCity] = useState(defaultCity);
  const [useGps, setUseGps] = useState(() => {
    try { return localStorage.getItem('useGps') === '1'; } catch { return false; }
  });
  const [prevCity, setPrevCity] = useState(() => {
    try { return localStorage.getItem('prevCity') || defaultCity; } catch { return defaultCity; }
  });
  const { coords, permission, startWatch, stopWatch } = useGeolocation();

  useEffect(() => {
    try { localStorage.setItem('useGps', useGps ? '1' : '0'); } catch {}
    if (useGps && permission !== 'denied') startWatch();
    if (!useGps) stopWatch();
  }, [useGps, permission, startWatch, stopWatch]);

  // Remember last typed city when enabling GPS, and restore when disabling
  useEffect(() => {
    if (useGps) {
      setPrevCity(city);
      try { localStorage.setItem('prevCity', city); } catch {}
    } else {
      // restore previously selected city for convenience
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
