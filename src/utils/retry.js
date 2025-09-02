// Exponential backoff retry for async functions returning a promise
export async function withRetry(fn, { retries = 2, baseDelayMs = 500 } = {}) {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries) throw err;
      const jitter = Math.random() * 0.3 + 0.85; // 0.85x–1.15x
      const delay = Math.round(baseDelayMs * 2 ** attempt * jitter);
      await new Promise(r => setTimeout(r, delay));
      attempt += 1;
    }
  }
}

