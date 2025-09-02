import { useEffect, useMemo, useState } from 'react';

// Returns a ticking local time string for a given timezone offset (seconds)
// If timeZone (IANA) is provided, it takes precedence over tzOffsetSec.
export function useLocalClock(tzOffsetSec = 0, { refreshMs = 1000, locale = 'vi-VN', timeZone } = {}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let raf;
    let timer;
    const tick = () => setNow(Date.now());
    // align to next second for cleaner display
    const ms = refreshMs <= 0 ? 1000 : refreshMs;
    const toNext = ms - (Date.now() % ms);
    timer = setTimeout(function loop() {
      tick();
      timer = setTimeout(loop, ms);
    }, toNext);
    return () => { clearTimeout(timer); cancelAnimationFrame?.(raf); };
  }, [refreshMs]);

  const date = useMemo(() => new Date(now + (timeZone ? 0 : (tzOffsetSec || 0)) * 1000), [now, tzOffsetSec, timeZone]);
  const time = useMemo(() => {
    const opts = { hour: '2-digit', minute: '2-digit' };
    if (timeZone) opts.timeZone = timeZone;
    return date.toLocaleTimeString(locale, opts);
  }, [date, locale, timeZone]);
  return { date, time };
}
