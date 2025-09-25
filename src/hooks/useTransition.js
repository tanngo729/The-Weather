import { useEffect, useState } from 'react';

export function useTransition(value, delayMs = 200) {
  const [deferredValue, setDeferredValue] = useState(value);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (value === deferredValue) return;

    setIsPending(true);
    const timer = setTimeout(() => {
      setDeferredValue(value);
      setIsPending(false);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, deferredValue, delayMs]);

  return [deferredValue, isPending];
}