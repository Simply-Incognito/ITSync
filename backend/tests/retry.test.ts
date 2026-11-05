import { afterEach, describe, expect, it, vi } from 'vitest';
import { retryWithExponentialBackoff } from '../src/utils/retry.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('retryWithExponentialBackoff', () => {
  it('retries with exponentially increasing delays and returns the successful result', async () => {
    vi.useFakeTimers();
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockRejectedValueOnce(new Error('still unavailable'))
      .mockResolvedValue('connected');
    const onRetry = vi.fn();

    const result = retryWithExponentialBackoff(operation, {
      maxAttempts: 3,
      initialDelayMs: 10,
      onRetry,
    });

    await vi.advanceTimersByTimeAsync(10);
    await vi.advanceTimersByTimeAsync(20);

    await expect(result).resolves.toBe('connected');
    expect(operation).toHaveBeenCalledTimes(3);
    expect(onRetry.mock.calls.map(([, attempt, delayMs]) => [attempt, delayMs])).toEqual([
      [1, 10],
      [2, 20],
    ]);
  });

  it('stops after the configured attempts and throws the final error', async () => {
    vi.useFakeTimers();
    const finalError = new Error('service unavailable');
    const operation = vi.fn<() => Promise<never>>().mockRejectedValue(finalError);

    const result = retryWithExponentialBackoff(operation, {
      maxAttempts: 3,
      initialDelayMs: 10,
      maxDelayMs: 15,
    });
    const rejection = expect(result).rejects.toBe(finalError);

    await vi.advanceTimersByTimeAsync(10);
    await vi.advanceTimersByTimeAsync(15);

    await rejection;
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('rejects invalid retry settings', async () => {
    await expect(
      retryWithExponentialBackoff(async () => 'connected', { maxAttempts: 0 }),
    ).rejects.toThrow('maxAttempts must be a positive integer.');
  });
});
