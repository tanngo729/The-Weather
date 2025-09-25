import { WEATHER_API } from '../config/env';

function buildQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  return q.toString();
}

function geoBase() {
  const base = (WEATHER_API.baseUrl || '').replace(/\/+$/, '');
  // Normalize to host, then use geo API path
  try {
    const u = new URL(base);
    return `${u.origin}/geo/1.0`;
  } catch {
    return 'https://api.openweathermap.org/geo/1.0';
  }
}

async function http(path, params = {}, { signal } = {}) {
  const url = `${geoBase()}${path}?${buildQuery({ ...params, appid: WEATHER_API.apiKey })}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = `Lỗi tra cứu vị trí (${res.status})`;
    if (res.status === 401) {
      message = 'API key không hợp lệ';
    } else if (res.status === 404) {
      message = 'Không tìm thấy thông tin vị trí';
    }
    const err = new Error(message);
    err.status = res.status;
    err.detail = text;
    throw err;
  }
  return res.json();
}

export const geoClient = {
  reverse: ({ lat, lon, limit = 1 }, opts) => http('/reverse', { lat, lon, limit }, opts),
};

