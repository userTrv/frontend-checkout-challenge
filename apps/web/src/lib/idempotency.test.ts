import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api';
import { IdempotentRequest } from './idempotency';
import type { KeyValueStore } from './storage';

const networkError = () => new ApiError({ kind: 'network' });
const conflict = () => new ApiError({ kind: 'http', status: 409, code: 'QUOTE_EXPIRED' });

function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    get: (key) => data.get(key) ?? null,
    set: (key, value) => void data.set(key, value),
    remove: (key) => void data.delete(key),
    getJson: (key) => (data.has(key) ? JSON.parse(data.get(key)!) : null),
    setJson: (key, value) => void data.set(key, JSON.stringify(value)),
  };
}

describe('IdempotentRequest', () => {
  it('retries a lost request with the same key and body', async () => {
    const request = new IdempotentRequest<{ quoteId: string }>();
    const send = vi.fn().mockRejectedValueOnce(networkError()).mockResolvedValueOnce('order');

    await expect(request.send({ quoteId: 'q1' }, send)).rejects.toThrow();
    expect(request.unanswered?.body).toEqual({ quoteId: 'q1' });
    await expect(request.send({ quoteId: 'q1' }, send)).resolves.toBe('order');

    expect(send.mock.calls[0][1]).toBe(send.mock.calls[1][1]);
    expect(request.unanswered).toBeNull();
  });

  it('uses a new key for the next attempt after an answer', async () => {
    const request = new IdempotentRequest<object>();
    const send = vi.fn().mockResolvedValue('payment');
    await request.send({}, send);
    await request.send({}, send);
    expect(send.mock.calls[0][1]).not.toBe(send.mock.calls[1][1]);
  });

  it('spends the key on a 4xx answer', async () => {
    const request = new IdempotentRequest<object>();
    const send = vi.fn().mockRejectedValueOnce(conflict()).mockResolvedValueOnce('ok');
    await expect(request.send({}, send)).rejects.toThrow();
    expect(request.unanswered).toBeNull();
    await request.send({}, send);
    expect(send.mock.calls[0][1]).not.toBe(send.mock.calls[1][1]);
  });

  it('uses a new key when the body changes', async () => {
    const request = new IdempotentRequest<{ quoteId: string }>();
    const send = vi.fn().mockRejectedValueOnce(networkError()).mockResolvedValueOnce('ok');
    await expect(request.send({ quoteId: 'q1' }, send)).rejects.toThrow();
    await request.send({ quoteId: 'q2' }, send);
    expect(send.mock.calls[0][1]).not.toBe(send.mock.calls[1][1]);
  });

  it('keeps an unanswered request across instances when persisted', async () => {
    const persistence = { store: memoryStore(), key: 'pending' };
    const first = new IdempotentRequest<{ quoteId: string }>(persistence);
    await expect(
      first.send({ quoteId: 'q1' }, () => Promise.reject(networkError())),
    ).rejects.toThrow();

    const afterReload = new IdempotentRequest<{ quoteId: string }>(persistence);
    expect(afterReload.unanswered).toEqual(first.unanswered);
  });
});
