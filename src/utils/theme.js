export function classifyWeather(desc = '', main = '', icon = '') {
  const d = (desc || main || '').toLowerCase();
  const byMain = (main || '').toLowerCase();
  if (d.includes('thunder') || byMain.includes('thunder')) return 'thunder';
  if (d.includes('rain') || d.includes('drizzle') || byMain.includes('rain') || byMain.includes('drizzle')) return 'rain';
  if (d.includes('snow') || byMain.includes('snow')) return 'snow';
  if (
    d.includes('mist') || d.includes('fog') || d.includes('haze') || d.includes('smoke') ||
    d.includes('dust') || d.includes('sand') || d.includes('ash') || d.includes('squall') || d.includes('tornado') ||
    byMain.includes('mist') || byMain.includes('fog') || byMain.includes('haze')
  ) return 'fog';
  if (d.includes('cloud') || byMain.includes('cloud')) return 'clouds';
  return 'clear';
}

function isNightLocal(nowMs, sunriseSec, sunsetSec, tzSec = 0) {
  try {
    const nowUTC = nowMs;
    const sunriseUTC = (sunriseSec || 0) * 1000;
    const sunsetUTC = (sunsetSec || 0) * 1000;
    return nowUTC < sunriseUTC || nowUTC > sunsetUTC;
  } catch { return false; }
}

export function chooseBackgroundTheme(current, forecast) {
  if (!current?.weather?.[0]) {
    return { theme: 'theme-clear', night: false };
  }

  const night = isNightLocal(Date.now(), current?.sys?.sunrise, current?.sys?.sunset, 0);

  const scores = { thunder: 5, rain: 4, snow: 4, fog: 3, clouds: 2, clear: 1 };
  let best = classifyWeather(current?.weather?.[0]?.description, current?.weather?.[0]?.main, current?.weather?.[0]?.icon);
  let bestScore = scores[best] || 0;

  const list = forecast?.list || [];
  const nextHours = list.filter(x => (x.dt * 1000 - Date.now()) <= 6 * 60 * 60 * 1000 && (x.dt * 1000 - Date.now()) >= 0).slice(0, 4);
  for (const it of nextHours) {
    const c = classifyWeather(it.weather?.[0]?.description, it.weather?.[0]?.main, it.weather?.[0]?.icon);
    if ((scores[c] || 0) > bestScore) { best = c; bestScore = scores[c]; }
  }

  // Map to CSS theme classes
  if (best === 'thunder') return { theme: 'theme-thunder', night };
  if (best === 'rain') return { theme: 'theme-rain', night };
  if (best === 'snow') return { theme: 'theme-snow', night };
  if (best === 'fog') return { theme: 'theme-fog', night };
  if (best === 'clouds') return { theme: night ? 'theme-night' : 'theme-clouds', night };
  if (best === 'clear') return { theme: night ? 'theme-night' : 'theme-clear', night };

  return { theme: 'theme-clear', night };
}

