import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { weatherClient } from '../api/weatherClient';
import { WEATHER_API } from '../config/env';
import { getCache, setCache } from '../utils/cache';
import { withRetry } from '../utils/retry';

function buildKey(kind, params) {
  return `${kind}:${Object.entries(params).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join('&')}`;
}

export function useWeather({ city, coords, pollMs = WEATHER_API.pollMs, forecast = false, cacheMs = 45_000 } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const ctrlRef = useRef(null);
  const timerRef = useRef(null);

  const paramsCoords = useMemo(() => {
    if (!coords || coords.lat == null || coords.lon == null) return null;
    const lat = Math.round(Number(coords.lat) * 1000) / 1000; // ~100m precision to reduce jitter
    const lon = Math.round(Number(coords.lon) * 1000) / 1000;
    return { lat, lon };
  }, [coords]);
  const paramsCity = useMemo(() => (city ? { q: city } : null), [city]);

  const fetcher = useCallback(async () => {
    if (!paramsCoords && !paramsCity) return;
    if (!WEATHER_API.apiKey) {
      throw new Error('Missing WEATHER_API_KEY. Set it in env.');
    }
    // cache check (prefer coords cache if present, else city)
    const keyCoords = paramsCoords ? buildKey(forecast ? 'forecast' : 'current', paramsCoords) : null;
    const keyCity = paramsCity ? buildKey(forecast ? 'forecast' : 'current', paramsCity) : null;
    const cached = (keyCoords && getCache(keyCoords)) || (keyCity && getCache(keyCity));
    if (cached) { setData(cached); setLastUpdated(Date.now()); return; }

    // abort previous fetch
    if (ctrlRef.current) ctrlRef.current.abort();
    ctrlRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const callCoords = () => forecast
        ? weatherClient.getForecastByCoords(paramsCoords, { signal: ctrlRef.current.signal })
        : weatherClient.getCurrentByCoords(paramsCoords, { signal: ctrlRef.current.signal });
      const callCity = () => forecast
        ? weatherClient.getForecastByCity(paramsCity, { signal: ctrlRef.current.signal })
        : weatherClient.getCurrentByCity(paramsCity, { signal: ctrlRef.current.signal });

      let result;
      if (paramsCoords) {
        try {
          result = await withRetry(callCoords);
          setData(result);
          if (keyCoords) setCache(keyCoords, result, cacheMs);
          setLastUpdated(Date.now());
        } catch (e) {
          if (e.name === 'AbortError') return;
          // Fallback: if 401 and we have city available, try city
          if (e.status === 401 && paramsCity) {
            result = await withRetry(callCity);
            setData(result);
            if (keyCity) setCache(keyCity, result, cacheMs);
            setLastUpdated(Date.now());
          } else {
            throw e;
          }
        }
      } else if (paramsCity) {
        result = await withRetry(callCity);
        setData(result);
        if (keyCity) setCache(keyCity, result, cacheMs);
        setLastUpdated(Date.now());
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [paramsCoords, paramsCity, forecast, cacheMs]);

  // initial + reactive fetch
  useEffect(() => {
    // Debounce initial/reactive fetch a bit to avoid rapid spins on GPS updates
    const id = setTimeout(() => { fetcher(); }, 300);
    return () => {
      clearTimeout(id);
      if (ctrlRef.current) ctrlRef.current.abort();
    };
  }, [fetcher]);

  // polling for real-time updates
  useEffect(() => {
    if (!pollMs || pollMs <= 0) return;
    if (!paramsCoords && !paramsCity) return;

    timerRef.current = setInterval(() => {
      // Skip if document hidden to save quota
      if (typeof document !== 'undefined' && document.hidden) return;
      fetcher();
    }, pollMs);
    return () => clearInterval(timerRef.current);
  }, [paramsCoords, paramsCity, pollMs, fetcher]);

  // refresh on tab focus / back online
  useEffect(() => {
    const onFocus = () => fetcher();
    const onOnline = () => fetcher();
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }, [fetcher]);

  const refresh = useCallback(() => fetcher(), [fetcher]);
  const isStale = useMemo(() => (lastUpdated ? Date.now() - lastUpdated > pollMs * 1.5 : true), [lastUpdated, pollMs]);

  return { data, loading, error, refresh, lastUpdated, isStale };
}
