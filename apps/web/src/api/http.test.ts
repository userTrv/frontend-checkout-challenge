import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './errors';
import { createHttpClient, type SessionAuth } from './http';

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

function setup(responses: Array<Response | Error>, auth?: SessionAuth) {
  const fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    const next = responses.shift()!;
    if (next instanceof Error) throw next;
    if (init?.signal?.aborted) throw new DOMException('aborted', 'AbortError');
    return next;
  });
  const client = createHttpClient({ baseUrl: 'http://api.test/', auth, fetch });
  return { client, fetch };
}

function fixedAuth(tokens: string[]): SessionAuth & { invalidated: string[] } {
  const invalidated: string[] = [];
  return {
    invalidated,
    token: async () => tokens[invalidated.length],
    invalidate: (token) => invalidated.push(token),
  };
}

async function caught(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('expected the request to fail');
}

describe('createHttpClient', () => {
  it('builds the request and unwraps the envelope', async () => {
    const { client, fetch } = setup([json(201, { data: { id: 'o1' }, meta: {}, links: {} })], {
      token: async () => 't1',
      invalidate: () => {},
    });

    const data = await client.request('/api/orders', {
      method: 'POST',
      body: { a: 1 },
      idempotencyKey: 'key-12345',
    });

    expect(data).toEqual({ id: 'o1' });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('http://api.test/api/orders');
    expect(init?.body).toBe('{"a":1}');
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer t1',
      'Content-Type': 'application/json',
      'Idempotency-Key': 'key-12345',
    });
  });

  it('skips auth and body headers for public GET requests', async () => {
    const { client, fetch } = setup([json(200, { data: [] })], fixedAuth(['t1']));
    await client.request('/api/products', { public: true });
    const headers = fetch.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('returns undefined for 204 without parsing a body', async () => {
    const { client } = setup([new Response(null, { status: 204 })]);
    await expect(
      client.request('/api/cart/items/x', { method: 'DELETE' }),
    ).resolves.toBeUndefined();
  });

  it('turns an error envelope into ApiError with code and fields', async () => {
    const body = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Проверьте поля.',
        fields: [{ path: 'body/customer/email', message: 'must match format email' }],
      },
      meta: { requestId: 'r1' },
    };
    const { client } = setup([json(400, body, { 'X-Request-Id': 'r1' })]);
    const error = await caught(client.request('/api/orders', { method: 'POST', body: {} }));
    expect(error).toMatchObject({
      kind: 'http',
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Проверьте поля.',
      requestId: 'r1',
    });
    expect(error.fields).toHaveLength(1);
  });

  it('falls back to the status when the error body is not JSON', async () => {
    const { client } = setup([new Response('<html>Bad gateway</html>', { status: 502 })]);
    const error = await caught(client.request('/api/cart'));
    expect(error).toMatchObject({ kind: 'http', status: 502, code: 'HTTP_502' });
  });

  it('reports a broken success body as a parse error', async () => {
    const { client } = setup([new Response('not json', { status: 200 })]);
    expect(await caught(client.request('/api/cart'))).toMatchObject({ kind: 'parse' });
  });

  it('reports a failed fetch as a network error', async () => {
    const { client } = setup([new TypeError('Failed to fetch')]);
    const error = await caught(client.request('/api/cart'));
    expect(error).toMatchObject({ kind: 'network', isOutcomeUnknown: true });
  });

  it('reports a request cancelled by the caller as aborted', async () => {
    const { client } = setup([json(200, { data: 1 })]);
    const controller = new AbortController();
    controller.abort();
    const error = await caught(client.request('/api/cart', { signal: controller.signal }));
    expect(error.kind).toBe('aborted');
  });

  it('renews a rejected session once and repeats the request', async () => {
    const auth = fixedAuth(['old', 'new']);
    const unauthorized = json(401, { error: { code: 'SESSION_INVALID', message: 'x' } });
    const { client, fetch } = setup([unauthorized, json(200, { data: 'ok' })], auth);

    await expect(client.request('/api/cart')).resolves.toBe('ok');
    expect(auth.invalidated).toEqual(['old']);
    const retryHeaders = fetch.mock.calls[1][1]?.headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe('Bearer new');
  });
});
