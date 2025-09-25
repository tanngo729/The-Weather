import { useCallback, useEffect, useRef, useState } from 'react';
import { geoClient } from '../api/geoClient';
import { getCache, setCache } from '../utils/cache';

export function useReverseGeocode(coords, { ttlMs = 10 * 60_000 } = {}) {
  const [label, setLabel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const ctrlRef = useRef(null);

  const run = useCallback(async () => {
    if (!coords?.lat || !coords?.lon) return;
    const key = `rev:${coords.lat.toFixed(3)},${coords.lon.toFixed(3)}`;
    const cached = getCache(key);
    if (cached?.data) { setLabel(cached.data); return; }
    if (ctrlRef.current) ctrlRef.current.abort();
    ctrlRef.current = new AbortController();
    setLoading(true); setError(null);
    try {
      const res = await geoClient.reverse({ lat: coords.lat, lon: coords.lon, limit: 1 }, { signal: ctrlRef.current.signal });
      const place = res?.[0];
      const text = place ? (place.local_names?.vi || place.name || `${coords.lat.toFixed(3)},${coords.lon.toFixed(3)}`) : `${coords.lat.toFixed(3)},${coords.lon.toFixed(3)}`;
      setLabel(text);
      setCache(key, text, ttlMs);
    } catch (e) {
      if (e.name === 'AbortError') return;
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [coords, ttlMs]);

  useEffect(() => {
    run();
    return () => {
      if (ctrlRef.current) {
        ctrlRef.current.abort();
        ctrlRef.current = null;
      }
    };
  }, [run]);

  return { label, loading, error, refresh: run };
}

