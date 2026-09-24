import { ApiError } from './errors';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  idempotencyKey?: string;
  public?: boolean;
  signal?: AbortSignal;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export interface SessionAuth {
  token(): Promise<string>;
  invalidate(token: string): void;
}

export interface HttpClient {
  send<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  request<T>(path: string, options?: RequestOptions): Promise<T>;
}

interface HttpClientConfig {
  baseUrl: string;
  auth?: SessionAuth;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

export function createHttpClient(config: HttpClientConfig): HttpClient {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  const timeoutMs = config.timeoutMs ?? 15_000;
  const fetchImpl = config.fetch ?? ((input, init) => fetch(input, init));

  async function send<T>(
    path: string,
    options: RequestOptions = {},
    canRenewSession = true,
  ): Promise<ApiResponse<T>> {
    const token = options.public || !config.auth ? undefined : await config.auth.token();
    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;

    let response: Response;
    let text: string;
    try {
      response = await fetchImpl(baseUrl + path, buildInit(options, token, signal));
      text = await response.text();
    } catch (cause) {
      throw options.signal?.aborted ? ApiError.aborted() : new ApiError({ kind: 'network', cause });
    }
    if (options.signal?.aborted) throw ApiError.aborted();

    if (response.status === 401 && token && canRenewSession) {
      config.auth!.invalidate(token);
      return send<T>(path, options, false);
    }
    const requestId = response.headers.get('X-Request-Id');
    if (!response.ok) throw ApiError.fromResponse(response.status, parseJson(text), requestId);
    if (!text) return { data: undefined as T, status: response.status, headers: response.headers };

    const payload = parseJson(text);
    if (!isEnvelope(payload))
      throw new ApiError({ kind: 'parse', status: response.status, requestId });
    return { data: payload.data as T, status: response.status, headers: response.headers };
  }

  return {
    send,
    request: <T>(path: string, options?: RequestOptions) =>
      send<T>(path, options).then((response) => response.data),
  };
}

function buildInit(
  { method = 'GET', body, idempotencyKey }: RequestOptions,
  token: string | undefined,
  signal: AbortSignal,
): RequestInit {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  return {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  };
}

function parseJson(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function isEnvelope(payload: unknown): payload is { data: unknown } {
  return typeof payload === 'object' && payload !== null && 'data' in payload;
}
