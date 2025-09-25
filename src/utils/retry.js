// Exponential backoff retry for async functions returning a promise
export async function withRetry(fn, { retries = 2, baseDelayMs = 500 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      if (err.status === 429 || err.status >= 500) {
        if (attempt >= retries) throw err;
        const jitter = Math.random() * 0.3 + 0.85;
        const delay = Math.round(baseDelayMs * 2 ** attempt * jitter);
        await new Promise(r => setTimeout(r, delay));
        attempt += 1;
      } else {
        throw err;
      }
    }
  }
}

