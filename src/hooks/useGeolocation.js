import { useCallback, useEffect, useRef, useState } from 'react';

export function useGeolocation(options = { enableHighAccuracy: false, timeout: 10_000, maximumAge: 30_000 }) {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('prompt'); // 'granted' | 'denied' | 'prompt' (best-effort)
  const watchIdRef = useRef(null);

  const getPermission = async () => {
    try {
      if (navigator.permissions?.query) {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        setPermission(status.state);
        status.onchange = () => setPermission(status.state);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => { getPermission(); }, []);

  const startWatch = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError(new Error('Geolocation is not supported'));
      return;
    }
    if (watchIdRef.current != null) return; // already watching
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setError(null);
      },
      (err) => {
        setError(err);
      },
      options
    );
  }, [options]);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation?.clearWatch) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => () => stopWatch(), [stopWatch]);

  return { coords, error, permission, startWatch, stopWatch };
}

