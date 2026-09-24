import { ApiError } from '../api';

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(ApiError.aborted());
    const onAbort = () => {
      clearTimeout(timer);
      reject(ApiError.aborted());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export interface PollOptions<T> {
  until: (value: T) => boolean;
  intervalMs: number;
  initialDelayMs?: number;
  signal: AbortSignal;
  maxNetworkFailures?: number;
  onValue?: (value: T) => void;
}

export async function poll<T>(
  load: (signal: AbortSignal) => Promise<T>,
  options: PollOptions<T>,
): Promise<T> {
  const { until, intervalMs, signal, onValue, maxNetworkFailures = 3 } = options;
  let failures = 0;
  await sleep(options.initialDelayMs ?? intervalMs, signal);
  for (;;) {
    try {
      const value = await load(signal);
      failures = 0;
      onValue?.(value);
      if (until(value)) return value;
    } catch (error) {
      const isNetwork = error instanceof ApiError && error.kind === 'network';
      if (!isNetwork || ++failures > maxNetworkFailures) throw error;
    }
    await sleep(intervalMs, signal);
  }
}
