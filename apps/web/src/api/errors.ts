export type ApiErrorKind = 'network' | 'http' | 'parse' | 'aborted' | 'unexpected';

export interface FieldIssue {
  path: string;
  message: string;
}

interface ApiErrorInit {
  kind: ApiErrorKind;
  message?: string;
  status?: number;
  code?: string;
  fields?: readonly FieldIssue[];
  requestId?: string | null;
  cause?: unknown;
}

const DEFAULT_MESSAGES: Record<ApiErrorKind, string> = {
  network: 'Нет связи с сервером. Проверьте подключение и повторите.',
  http: 'Сервер не смог выполнить запрос. Повторите попытку.',
  parse: 'Сервер вернул неожиданный ответ. Повторите попытку.',
  aborted: 'Запрос отменён.',
  unexpected: 'Что-то пошло не так. Обновите страницу и повторите.',
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly code: string;
  readonly fields: readonly FieldIssue[];
  readonly requestId: string | null;

  constructor(init: ApiErrorInit) {
    super(init.message ?? DEFAULT_MESSAGES[init.kind], { cause: init.cause });
    this.name = 'ApiError';
    this.kind = init.kind;
    this.status = init.status ?? 0;
    this.code = init.code ?? `${init.kind.toUpperCase()}_ERROR`;
    this.fields = init.fields ?? [];
    this.requestId = init.requestId ?? null;
  }

  static aborted(): ApiError {
    return new ApiError({ kind: 'aborted', code: 'ABORTED' });
  }

  static fromResponse(status: number, body: unknown, requestId: string | null): ApiError {
    if (isErrorBody(body)) {
      const { code, message, fields } = body.error;
      return new ApiError({ kind: 'http', status, code, message, fields, requestId });
    }
    return new ApiError({
      kind: 'http',
      status,
      code: `HTTP_${status}`,
      message: status >= 500 ? 'Сервер временно недоступен. Повторите попытку.' : undefined,
      requestId,
    });
  }

  get isOutcomeUnknown(): boolean {
    return this.kind !== 'http' || this.status >= 500;
  }
}

interface ErrorBody {
  error: { code: string; message: string; fields?: FieldIssue[] };
}

function isErrorBody(body: unknown): body is ErrorBody {
  if (typeof body !== 'object' || body === null || !('error' in body)) return false;
  const { error } = body as { error: unknown };
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as ErrorBody['error']).code === 'string' &&
    typeof (error as ErrorBody['error']).message === 'string'
  );
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  console.error(error);
  return new ApiError({ kind: 'unexpected', cause: error });
}

export function isAborted(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'aborted';
}

export function hasErrorCode(error: unknown, ...codes: string[]): error is ApiError {
  return error instanceof ApiError && codes.includes(error.code);
}
