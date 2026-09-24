import { useCallback, useEffect, useMemo, useState, type DependencyList } from 'react';
import { isAborted, toApiError, type ApiError } from '../api';
import { useLatestTask } from './useLatestTask';

export interface Resource<T> {
  data: T | undefined;
  error: ApiError | null;
  loading: boolean;
  reload(): Promise<void>;
}

interface ResourceState<T> {
  data: T | undefined;
  error: ApiError | null;
  loading: boolean;
}

const IDLE: ResourceState<never> = { data: undefined, error: null, loading: false };

export function useResource<T>(
  load: ((signal: AbortSignal) => Promise<T>) | null,
  deps: DependencyList,
  merge?: (previous: T | undefined, next: T) => T,
): Resource<T> {
  const [state, setState] = useState<ResourceState<T>>({
    data: undefined,
    error: null,
    loading: load !== null,
  });
  const latest = useLatestTask();

  const reload = useCallback(async () => {
    if (!load) {
      latest.cancel();
      setState((s) => (s.data === undefined && !s.error && !s.loading ? s : IDLE));
      return;
    }
    setState((s) => (s.loading && !s.error ? s : { ...s, loading: true, error: null }));
    try {
      const next = await latest.run(load);
      setState((s) => ({ data: merge ? merge(s.data, next) : next, error: null, loading: false }));
    } catch (error) {
      if (isAborted(error)) return;
      setState((s) => ({ ...s, error: toApiError(error), loading: false }));
    }
  }, [latest, ...deps]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return useMemo(() => ({ ...state, reload }), [state, reload]);
}
