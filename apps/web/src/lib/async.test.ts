import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api';
import { poll, sleep } from './async';

describe('sleep', () => {
  it('rejects as aborted when the signal fires', async () => {
    const controller = new AbortController();
    const waiting = sleep(10_000, controller.signal);
    controller.abort();
    await expect(waiting).rejects.toMatchObject({ kind: 'aborted' });
  });
});

describe('poll', () => {
  const signal = new AbortController().signal;

  it('returns the first value that satisfies the condition', async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('processing')
      .mockResolvedValueOnce('processing')
      .mockResolvedValueOnce('succeeded');
    const onValue = vi.fn();

    const result = await poll(load, {
      until: (s) => s !== 'processing',
      intervalMs: 1,
      signal,
      onValue,
    });

    expect(result).toBe('succeeded');
    expect(load).toHaveBeenCalledTimes(3);
    expect(onValue).toHaveBeenCalledTimes(3);
  });

  it('waits out a few network failures', async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new ApiError({ kind: 'network' }))
      .mockResolvedValueOnce('done');
    await expect(poll(load, { until: () => true, intervalMs: 1, signal })).resolves.toBe('done');
  });

  it('stops on an HTTP error', async () => {
    const load = vi.fn().mockRejectedValue(new ApiError({ kind: 'http', status: 404 }));
    await expect(poll(load, { until: () => true, intervalMs: 1, signal })).rejects.toMatchObject({
      status: 404,
    });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('stops when aborted between checks', async () => {
    const controller = new AbortController();
    const load = vi.fn(async () => {
      controller.abort();
      return 'processing';
    });
    await expect(
      poll(load, { until: () => false, intervalMs: 1, signal: controller.signal }),
    ).rejects.toMatchObject({ kind: 'aborted' });
    expect(load).toHaveBeenCalledTimes(1);
  });
});
