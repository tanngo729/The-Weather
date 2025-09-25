import { useEffect, useMemo, useState } from 'react';

// Returns a ticking local time string for a given timezone offset (seconds)
// If timeZone (IANA) is provided, it takes precedence over tzOffsetSec.
export function useLocalClock(tzOffsetSec = 0, { refreshMs = 1000, locale = 'vi-VN', timeZone } = {}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let timer;
    const tick = () => setNow(Date.now());
    const ms = refreshMs <= 0 ? 1000 : refreshMs;
    const toNext = ms - (Date.now() % ms);
    timer = setTimeout(function loop() {
      tick();
      timer = setTimeout(loop, ms);
    }, toNext);
    return () => { clearTimeout(timer); };
  }, [refreshMs]);

  const time = useMemo(() => {
    if (timeZone) {
      return new Date(now).toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone
      });
    }
    const utcMs = now;
    const localMs = utcMs + (tzOffsetSec || 0) * 1000;
    return new Date(localMs).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  }, [now, tzOffsetSec, timeZone, locale]);

  return { time };
}
