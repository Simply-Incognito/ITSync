export interface ExponentialBackoffOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

const defaultMaxAttempts = 5;
const defaultInitialDelayMs = 500;
const defaultMaxDelayMs = 8_000;

export async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  options: ExponentialBackoffOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? defaultMaxAttempts;
  const initialDelayMs = options.initialDelayMs ?? defaultInitialDelayMs;
  const maxDelayMs = options.maxDelayMs ?? defaultMaxDelayMs;

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError('maxAttempts must be a positive integer.');
  }
  if (!Number.isFinite(initialDelayMs) || initialDelayMs < 0) {
    throw new RangeError('initialDelayMs must be a non-negative number.');
  }
  if (!Number.isFinite(maxDelayMs) || maxDelayMs < 0) {
    throw new RangeError('maxDelayMs must be a non-negative number.');
  }

  for (let attempt = 1; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= maxAttempts) throw error;

      const delayMs = Math.min(initialDelayMs * 2 ** (attempt - 1), maxDelayMs);
      options.onRetry?.(error, attempt, delayMs);
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
