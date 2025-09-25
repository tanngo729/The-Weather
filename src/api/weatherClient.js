import { WEATHER_API } from '../config/env';

// Minimal wrapper around fetch for weather endpoints
// Defaults to OpenWeatherMap schema: /weather (current) and /forecast (5-day)
function buildQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  return q.toString();
}

async function http(path, params = {}, { signal } = {}) {
  const base = (WEATHER_API.baseUrl || '').replace(/\/+$/, '');
  // Guard: OpenWeather's /weather and /forecast live on v2.5. If user set 3.0, fallback.
  const versionedBase = (/\/data\/3\.0$/.test(base) && (path === '/weather' || path === '/forecast'))
    ? base.replace(/\/data\/3\.0$/, '/data/2.5')
    : base;

  const url = `${versionedBase}${path}?${buildQuery({
    ...params,
    appid: WEATHER_API.apiKey,
    units: WEATHER_API.units,
    lang: WEATHER_API.lang,
  })}`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch {}
    let message = `Lỗi kết nối API thời tiết (${res.status})`;
    if (res.status === 401) {
      message = 'API key không hợp lệ hoặc chưa được kích hoạt';
    } else if (res.status === 404) {
      message = 'Không tìm thấy thông tin địa điểm';
    } else if (res.status === 429) {
      message = 'Vượt quá giới hạn truy vấn, vui lòng thử lại sau';
    } else if (res.status >= 500) {
      message = 'Máy chủ gặp sự cố, vui lòng thử lại sau';
    }
    const err = new Error(message);
    err.status = res.status;
    err.detail = detail;
    throw err;
  }
  return res.json();
}

export const weatherClient = {
  // by city name, e.g. { q: 'Hanoi' }
  getCurrentByCity: (params, opts) => http('/weather', params, opts),
  getForecastByCity: (params, opts) => http('/forecast', params, opts),

  // by coordinates { lat, lon }
  getCurrentByCoords: (coords, opts) => http('/weather', coords, opts),
  getForecastByCoords: (coords, opts) => http('/forecast', coords, opts),
};
