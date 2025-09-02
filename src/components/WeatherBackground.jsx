import { useEffect, useMemo, useState } from 'react';
import { BG_ASSETS } from '../config/env';

export default function WeatherBackground({ theme = 'theme-clear', fx = 'med', night = false }) {
  // Map theme to asset base name in /public/bg/*.mp4|webm
  const pick = () => {
    if (theme.includes('night')) return 'clear-night';
    if (theme.includes('rain')) return 'rain';
    if (theme.includes('snow')) return 'snow';
    if (theme.includes('thunder')) return 'thunder';
    if (theme.includes('fog')) return 'fog';
    if (theme.includes('cloud')) return night ? 'clouds-night' : 'clouds';
    if (theme.includes('clear')) return night ? 'clear-night' : 'clear-day';
    return night ? 'clear-night' : 'clear-day';
  };
  const forcedName = useMemo(() => {
    try {
      const envForce = (typeof import.meta !== 'undefined' && import.meta.env) ? (import.meta.env.VITE_BG_FORCE || import.meta.env.BG_FORCE) : '';
      if (envForce) return envForce;
      if (typeof window !== 'undefined') {
        const p = new URLSearchParams(window.location.search);
        const q = p.get('bg');
        if (q) return q;
      }
    } catch {}
    return '';
  }, []);
  const name = forcedName || pick();
  const [videoOk, setVideoOk] = useState(true);
  const [sourceKind, setSourceKind] = useState('static'); // only static now
  const [hasLoggedError, setHasLoggedError] = useState(false);
  const [currentExt, setCurrentExt] = useState('mp4'); // try mp4 first since you uploaded mp4

  const FALLBACK_IMAGES = {
    'clear-day': 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1920&auto=format&fit=crop',
    'clear-night': 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1920&auto=format&fit=crop',
    'clouds': 'https://images.unsplash.com/photo-1521252659862-eec69941b071?q=80&w=1920&auto=format&fit=crop',
    'clouds-night': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1920&auto=format&fit=crop',
    'rain': 'https://images.unsplash.com/photo-1465479423260-c4afc24172c6?q=80&w=1920&auto=format&fit=crop',
    'snow': 'https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?q=80&w=1920&auto=format&fit=crop',
    'thunder': 'https://images.unsplash.com/photo-1472148439583-50c3889fccb7?q=80&w=1920&auto=format&fit=crop',
    'fog': 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?q=80&w=1920&auto=format&fit=crop',
  };
  const appBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
  const rawBgBase = BG_ASSETS.base || 'bg/';
  // If BG_BASE_URL is absolute (starts with http), use as-is; else join with app base
  const withBase = (p) => {
    const bg = /^https?:/i.test(rawBgBase)
      ? (rawBgBase.endsWith('/') ? rawBgBase : rawBgBase + '/')
      : ((appBase.endsWith('/') ? appBase : appBase + '/') + rawBgBase.replace(/^\/+/, ''));
    return bg + p.replace(/^\/+/, '');
  };
  const sources = useMemo(() => (
    [{ src: withBase(`${name}.${currentExt}`), type: `video/${currentExt}` }]
  ), [name, currentExt]);

  return (
    <div
      className={`bg-video fx-${fx} ${theme} ${videoOk ? '' : 'bg-fallback'}`}
      aria-hidden="true"
      data-bg-name={name}
      data-bg-source={sourceKind}
      style={!videoOk ? {
        backgroundImage: `url(${FALLBACK_IMAGES[name] || FALLBACK_IMAGES['clear-day']})`,
        backgroundSize: 'cover', backgroundPosition: 'center'
      } : undefined}
    >
      {/* Gradient to ensure readability */}
      <div className="bg-gradient" />
      {videoOk && sources && sources.length > 0 ? (
        <video
          className="bg-media"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          key={`${name}-${currentExt}`}
          onError={() => {
            // Try alternate extension once
            const next = currentExt === 'mp4' ? 'webm' : 'mp4';
            if (next !== currentExt) {
              setCurrentExt(next);
              setVideoOk(true);
            } else {
              setVideoOk(false);
              if (!hasLoggedError && typeof window !== 'undefined') {
                console.warn('[BG] video error');
                setHasLoggedError(true);
              }
            }
          }}
          onLoadedData={() => {
            setVideoOk(true);
            if (typeof window !== 'undefined') {
              window.__BG_SRC = sources?.[0]?.src;
              console.info('[BG] loaded', { kind: sourceKind, name, src: sources?.[0]?.src });
            }
          }}
        >
          {sources.map(s => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
      ) : null}
    </div>
  );
}
