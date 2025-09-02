// Simple env getter that supports both Vite and CRA
export function getEnv(name, defaultValue = undefined) {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const v = import.meta.env[name] ?? import.meta.env["VITE_" + name] ?? import.meta.env[name.replace(/^REACT_APP_/, 'VITE_')];
    return v ?? defaultValue;
  }
  if (typeof process !== 'undefined' && process.env) {
    const v = process.env[name] ?? process.env["REACT_APP_" + name] ?? process.env[name.replace(/^VITE_/, 'REACT_APP_')];
    return v ?? defaultValue;
  }
  return defaultValue;
}

export const WEATHER_API = {
  // Default to OpenWeatherMap, change if you prefer another provider
  baseUrl: getEnv('WEATHER_BASE_URL', 'https://api.openweathermap.org/data/2.5'),
  apiKey: getEnv('WEATHER_API_KEY', ''),
  units: getEnv('WEATHER_UNITS', 'metric'),
  lang: getEnv('WEATHER_LANG', 'vi'),
  pollMs: Number(getEnv('WEATHER_POLL_MS', 60_000)),
};

// Background assets base (absolute CDN or relative folder under public)
export const BG_ASSETS = {
  // Examples:
  // - "/bg/" (default local folder under public)
  // - "https://cdn.example.com/weather-bg/"
  base: getEnv('BG_BASE_URL', 'bg/'),
};
