import { useEffect, useMemo, useState } from 'react';
import { WeatherProvider, useWeatherContext } from './context/WeatherProvider';
import { useWeather } from './hooks/useWeather';
import { WEATHER_API } from './config/env';
import { useReverseGeocode } from './hooks/useReverseGeocode';
import WeatherBackground from './components/WeatherBackground';
import { useLocalClock } from './hooks/useLocalClock';
import { chooseBackgroundTheme } from './utils/theme';
import { useDebounce } from './hooks/useDebounce';
import { useTransition } from './hooks/useTransition';
import { useToast } from './hooks/useToast';
import { filterCities } from './data/cities';
import Toast from './components/Toast';

function formatLocalTime(tsSec, tzOffsetSec) {
  if (!tsSec) return '';
  try {
    const d = new Date((tsSec + (tzOffsetSec || 0)) * 1000);
    return d.toUTCString();
  } catch { return ''; }
}

function formatLocalHM(tsSec, tzOffsetSec) {
  if (!tsSec) return '';
  try {
    const d = new Date((tsSec + (tzOffsetSec || 0)) * 1000);
    return d.toUTCString();
  } catch { return ''; }
}

function faIconFor(description, code) {
  const d = (description || '').toLowerCase();
  const isNight = typeof code === 'string' && code.endsWith('n');
  if (d.includes('giông') || d.includes('thunder') || d.includes('storm')) return 'fa-cloud-bolt';
  if (d.includes('mưa') || d.includes('rain') || d.includes('drizzle')) return 'fa-cloud-showers-heavy';
  if (d.includes('tuyết') || d.includes('snow')) return 'fa-snowflake';
  if (d.includes('sương') || d.includes('mist') || d.includes('fog') || d.includes('haze') || d.includes('khói') || d.includes('smoke')) return 'fa-smog';
  if (d.includes('mây') || d.includes('cloud')) return isNight ? 'fa-cloud-moon' : 'fa-cloud-sun';
  if (d.includes('nắng') || d.includes('clear')) return isNight ? 'fa-moon' : 'fa-sun';
  return isNight ? 'fa-cloud-moon' : 'fa-cloud-sun';
}

function themeFor(description, code) {
  const d = (description || '').toLowerCase();
  const isNight = typeof code === 'string' && code.endsWith('n');
  if (d.includes('giông') || d.includes('thunder') || d.includes('storm')) return 'theme-thunder';
  if (d.includes('mưa') || d.includes('rain') || d.includes('drizzle')) return 'theme-rain';
  if (d.includes('tuyết') || d.includes('snow')) return 'theme-snow';
  if (d.includes('sương') || d.includes('mist') || d.includes('fog') || d.includes('haze') || d.includes('khói') || d.includes('smoke')) return 'theme-fog';
  if (d.includes('mây') || d.includes('cloud')) return isNight ? 'theme-night' : 'theme-clouds';
  if (d.includes('nắng') || d.includes('clear')) return isNight ? 'theme-night' : 'theme-clear';
  return isNight ? 'theme-night' : 'theme-clear';
}

function CurrentWeatherCard({ cityOverride, onError, onSearchSuccess }) {
  const { coords, permission, useGps, setUseGps, startWatch } = useWeatherContext();
  useEffect(() => { if (useGps && permission !== 'denied') startWatch(); }, [useGps, permission, startWatch]);
  const { data, loading, error, refresh, lastUpdated, isStale } = useWeather({
    city: cityOverride,
    coords: useGps ? coords : undefined,
    pollMs: WEATHER_API.pollMs,
    forecast: false,
  });

  useEffect(() => {
    if (error && cityOverride) {
      onError?.(error.message, 'error', 2500);
    }
  }, [error, cityOverride, onError]);

  useEffect(() => {
    if (data && cityOverride && !error) {
      onSearchSuccess?.();
    }
  }, [data, cityOverride, error, onSearchSuccess]);

  const showLoading = (!data && loading);
  const tz = data?.timezone ?? 0;
  const clockLocal = useLocalClock(tz, { refreshMs: 1000 });
  const clockVN = useLocalClock(0, { refreshMs: 1000, timeZone: 'Asia/Ho_Chi_Minh' });

  return (
    <section className="card now-card">
      {showLoading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}
      {data && (
        <div className="now">
          <div className="now__temp">{Math.round(data.main?.temp)}°c</div>
          <i className={`fa-solid ${faIconFor(data.weather?.[0]?.description, data.weather?.[0]?.icon)} now__icon`}></i>
          <div className="now__desc">{data.weather?.[0]?.description}</div>
          <div className="now__meta">
            <div className="now__line"><i className="fa-regular fa-calendar"></i><span className="now__date">{new Date().toLocaleDateString('vi-VN', { weekday:'long', day:'numeric', month:'long' })}</span></div>
            <div className="now__line"><i className="fa-regular fa-clock"></i><span className="now__time">Giờ địa phương: {clockLocal.time}</span></div>
            <div className="now__line"><i className="fa-regular fa-clock"></i><span className="now__time now__time-vn">Giờ VN (UTC+7): {clockVN.time}</span></div>
            <div className="now__line now__place"><i className="fa-solid fa-location-dot"></i><span>{data.name}</span></div>
          </div>
        </div>
      )}
      <footer className="card__footer"><small>Giờ VN: {clockVN.time} • Cập nhật: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('vi-VN') : '—'} {isStale && '• chậm'}</small></footer>
    </section>
  );
}

function ForecastList({ cityOverride }) {
  const { coords, useGps } = useWeatherContext();
  const { data, loading, error } = useWeather({ coords: useGps ? coords : undefined, city: cityOverride, forecast: true, pollMs: 0, cacheMs: 5 * 60_000 });
  const showLoading = (!data && loading);

  // Group forecast entries by day
  const days = useMemo(() => {
    if (!data?.list) return [];
    const groups = new Map();
    data.list.forEach((item) => {
      const day = new Date(item.dt * 1000).toLocaleDateString();
      if (!groups.has(day)) groups.set(day, []);
      groups.get(day).push(item);
    });
    return Array.from(groups.entries());
  }, [data]);

  return (
    <section className="card forecast">
      <header className="card__header"><h2>5 Days Forecast</h2></header>
      {showLoading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}
      {error && <p className="error">Lỗi: {error.message}</p>}
      <div className="days">
        {days.map(([day, items]) => (
          <div className="day" key={day}>
            <h3>{day}</h3>
            <div className="slots">
              {items.map(slot => (
                <div className="slot" key={slot.dt} title={slot.weather?.[0]?.description}>
                  <div className="t">{new Date(slot.dt * 1000).toLocaleTimeString([], { hour: '2-digit' })}</div>
                  <i className={`fa-solid ${faIconFor(slot.weather?.[0]?.description, slot.weather?.[0]?.icon)} slot-icon`}></i>
                  <div className="v">{Math.round(slot.main?.temp)}°</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Highlights({ current }) {
  if (!current) return null;
  const tz = current.timezone || 0;
  const sunrise = new Date((current.sys?.sunrise + tz) * 1000).toUTCString();
  const sunset = new Date((current.sys?.sunset + tz) * 1000).toUTCString();
  const visibilityKm = (current.visibility ?? 0) / 1000;
  return (
    <section className="card highlights">
      <header className="card__header"><h2>Today’s Highlights</h2></header>
      <div className="hl-grid">
        <div className="hl-item"><div className="hl-label"><i className="fa-solid fa-droplet hl-icon"></i> Độ ẩm</div><div className="hl-value">{current.main?.humidity}%</div></div>
        <div className="hl-item"><div className="hl-label"><i className="fa-solid fa-gauge-high hl-icon"></i> Áp suất</div><div className="hl-value">{current.main?.pressure} hPa</div></div>
        <div className="hl-item"><div className="hl-label"><i className="fa-regular fa-eye hl-icon"></i> Tầm nhìn</div><div className="hl-value">{visibilityKm.toFixed(1)} km</div></div>
        <div className="hl-item"><div className="hl-label"><i className="fa-solid fa-temperature-half hl-icon"></i> Cảm giác</div><div className="hl-value">{Math.round(current.main?.feels_like)}°c</div></div>
        <div className="hl-item"><div className="hl-label"><i className="fa-regular fa-sun hl-icon"></i>Cực điểm ban ngày</div><div className="hl-value">{new Date(sunrise).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })}</div></div>
        <div className="hl-item"><div className="hl-label"><i className="fa-regular fa-moon hl-icon"></i>Cực điểm ban đêm</div><div className="hl-value">{new Date(sunset).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })}</div></div>
      </div>
    </section>
  );
}

function TodayHourly({ forecast }) {
  const items = useMemo(() => {
    if (!forecast?.list) return [];
    const now = new Date();
    const today = now.toDateString();
    const next = forecast.list.filter(x => new Date(x.dt * 1000).toDateString() === today).slice(0, 8);
    return next;
  }, [forecast]);
  if (!items.length) return null;
  return (
    <section className="card hourly">
      <header className="card__header"><h2>Today at</h2></header>
      <div className="hourly-strip">
        {items.map(slot => (
          <div className="hour" key={slot.dt}>
            <div className="h">{new Date(slot.dt * 1000).toLocaleTimeString([], { hour: 'numeric' })}</div>
            <i className={`fa-solid ${faIconFor(slot.weather?.[0]?.description, slot.weather?.[0]?.icon)} slot-icon`}></i>
            <div className="t">{Math.round(slot.main?.temp)}°</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ForecastStrip({ forecast }) {
  if (!forecast?.list) return null;
  // Group into calendar days and summarize
  const groups = new Map();
  forecast.list.forEach(item => {
    const day = new Date(item.dt * 1000).toLocaleDateString('vi-VN');
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day).push(item);
  });
  const todayStr = new Date().toLocaleDateString('vi-VN');
  const days = Array.from(groups.entries()).filter(([day]) => day !== todayStr).slice(0, 5).map(([day, items]) => {
    let min = Infinity, max = -Infinity;
    const iconCount = new Map();
    items.forEach(it => {
      const t = it.main?.temp;
      if (t != null) { min = Math.min(min, t); max = Math.max(max, t); }
      const ic = it.weather?.[0]?.icon;
      if (ic) iconCount.set(ic, (iconCount.get(ic) || 0) + 1);
    });
    const icon = Array.from(iconCount.entries()).sort((a,b) => b[1]-a[1])[0]?.[0];
    const desc = items.find(x => x.weather?.[0]?.icon === icon)?.weather?.[0]?.description || items[0]?.weather?.[0]?.description;
    return { day, min: Math.round(min), max: Math.round(max), icon, desc };
  });

  return (
    <section className="card forecast-strip">
      <div className="fs-days">
        {days.map(d => (
          <div className="fs-day" key={d.day} title={d.desc}>
            <div className="fs-name">{d.day}</div>
            <i className={`fa-solid ${faIconFor(d.desc, d.icon)} fs-icon`}></i>
            <div className="fs-temps">
              <span className="hi">{d.max}°</span>
              <span className="lo">{d.min}°</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Shell() {
  const { city, setCity, coords, permission, useGps, setUseGps, startWatch } = useWeatherContext();
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const debouncedInput = useDebounce(input, 200);
  const suggestions = useMemo(() => filterCities(debouncedInput), [debouncedInput]);
  const { toasts, showToast, removeToast } = useToast();

  // Chỉ hiển thị city hiện tại trong placeholder, không trong input
  useEffect(() => {
    if (!searchAttempted && city && !input) {
      // Không tự động điền city vào input nữa
    }
  }, [city, searchAttempted, input]);

  const submit = (e) => {
    e.preventDefault();
    const sanitized = input.trim().replace(/[<>\"'&]/g, '').slice(0, 100);
    if (sanitized) {
      setSearchAttempted(true);
      setShowSuggestions(false);
      if (useGps) {
        setUseGps(false);
      }
      // Set city để thử tìm kiếm, input sẽ bị xóa khi thành công hoặc lỗi
      setCity(sanitized);
    }
  };

  const selectSuggestion = (suggestion) => {
    setSearchAttempted(true);
    setCity(suggestion);
    setShowSuggestions(false);
    if (useGps) {
      setUseGps(false);
    }
    // Xóa input ngay khi chọn suggestion
    setTimeout(() => {
      setInput('');
    }, 100);
  };

  const { label: placeLabel } = useReverseGeocode(coords);
  const [currentCity, currentPending] = useTransition(city, 100);
  const [currentCoords, coordsPending] = useTransition(useGps ? coords : undefined, 100);
  const { data: currentData, loading: currentLoading } = useWeather({ city: currentCity, coords: currentCoords, forecast: false, pollMs: 0, cacheMs: 30_000 });
  const { data: forecastData, loading: forecastLoading } = useWeather({ city: currentCity, coords: currentCoords, forecast: true, pollMs: 0, cacheMs: 5 * 60_000 });
  const isChangingLocation = currentPending || coordsPending || (currentLoading && !currentData) || (forecastLoading && !forecastData);
  const bg = chooseBackgroundTheme(currentData, forecastData);
  const theme = bg.theme;
  const isNight = bg.night;

  return (
    <div className={`container ${theme} fx-med tone-bright`}>
      <WeatherBackground theme={theme} fx={'med'} night={isNight} />
      {isChangingLocation && (
        <div className="location-loading">
          <div className="loading-content">
            <div className="spinner"></div>
            <span>Đang chuyển vị trí...</span>
          </div>
        </div>
      )}
      <header className="topbar">
        <div className="brand"><i className="fa-solid fa-cloud-sun brand-icon"></i><span>weatherio</span></div>
        <form onSubmit={submit} className="searchbar" style={{ position: 'relative' }}>
          <i className="fa-solid fa-magnifying-glass s-icon" aria-hidden="true"></i>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={city ? `Hiện tại: ${city} - Nhập để tìm thành phố khác...` : "Nhập tên thành phố (VD: London, Paris, Tokyo)..."}
            aria-label="Tìm kiếm địa điểm"
          />
          <button type="submit" className="s-btn">Tìm</button>
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((suggestion, i) => (
                <div
                  key={suggestion}
                  className="suggestion-item"
                  onClick={() => selectSuggestion(suggestion)}
                >
                  <i className="fa-solid fa-location-dot suggestion-icon"></i>
                  <span className="suggestion-text">{suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </form>
        <div className="top-actions">
          <button
            type="button"
            className="btn-current-loc"
            onClick={() => {
              if (!useGps) {
                setInput('');
                setCity('');
                setSearchAttempted(false);
                setUseGps(true);
                startWatch();
              }
            }}
            disabled={permission === 'denied' || useGps}
          >
            <i className="fa-solid fa-location-crosshairs" style={{ marginRight: '6px' }}></i>
            {useGps ? 'Đang dùng GPS' : 'Vị trí hiện tại'}
          </button>
        </div>
      </header>
      <main className="layout">
        <aside className="sidebar">
          <CurrentWeatherCard
          cityOverride={city}
          onError={(msg, type, duration) => {
            showToast(msg, type, duration);
            // Nếu có lỗi và đang search, reset city về trống
            if (searchAttempted && city) {
              setCity('');
              setSearchAttempted(false);
            }
          }}
          onSearchSuccess={() => {
            // Xóa input khi tìm kiếm thành công
            if (searchAttempted) {
              setInput('');
            }
          }}
        />
        </aside>
        <section className="main">
          <Highlights current={currentData} />
          <TodayHourly forecast={forecastData} />
        </section>
      </main>
      <ForecastStrip forecast={forecastData} />
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WeatherProvider>
      <Shell />
    </WeatherProvider>
  );
}
