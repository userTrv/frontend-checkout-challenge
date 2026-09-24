import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { isAborted, toApiError, type ApiError } from '../api';

export interface Action<Args extends unknown[], Result> {
  run(...args: Args): Promise<Result | undefined>;
  pending: boolean;
  error: ApiError | null;
  clearError(): void;
}

export function useAction<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
): Action<Args, Result> {
  const [state, setState] = useState<{ pending: boolean; error: ApiError | null }>({
    pending: false,
    error: null,
  });
  const inFlight = useRef(false);
  const actionRef = useRef(action);
  useLayoutEffect(() => {
    actionRef.current = action;
  });

  const run = useCallback(async (...args: Args) => {
    if (inFlight.current) return undefined;
    inFlight.current = true;
    setState({ pending: true, error: null });
    try {
      const result = await actionRef.current(...args);
      setState({ pending: false, error: null });
      return result;
    } catch (error) {
      setState({ pending: false, error: isAborted(error) ? null : toApiError(error) });
      return undefined;
    } finally {
      inFlight.current = false;
    }
  }, []);

  const clearError = useCallback(() => setState((s) => (s.error ? { ...s, error: null } : s)), []);

  return { ...state, run, clearError };
}
