export type RetryOptions = {
  retries?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  shouldRetry?: (error: unknown) => boolean;
};

const defaultShouldRetry = (error: unknown) => {
  const anyErr = error as any;
  const status = anyErr?.status ?? anyErr?.response?.status;
  if (status === 429) return true;
  if (typeof status === 'number' && status >= 500) return true;

  const code = anyErr?.code;
  if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'ENOTFOUND') return true;

  return false;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    retries = 2,
    minDelayMs = 400,
    maxDelayMs = 4000,
    factor = 2,
    shouldRetry = defaultShouldRetry,
  } = options;

  let attempt = 0;
  let delay = minDelayMs;

  for (;;) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      if (attempt > retries || !shouldRetry(error)) throw error;

      const jitter = Math.floor(Math.random() * 120);
      await sleep(delay + jitter);
      delay = Math.min(maxDelayMs, delay * factor);
    }
  }
}
