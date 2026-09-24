import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ApiError } from '../api';

export interface LatestTask {
  run<T>(task: (signal: AbortSignal) => Promise<T>): Promise<T>;
  cancel(): void;
}

export function useLatestTask(): LatestTask {
  const controllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const run = useCallback(<T>(task: (signal: AbortSignal) => Promise<T>) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    return task(controller.signal).then((value) => {
      if (controller.signal.aborted) throw ApiError.aborted();
      return value;
    });
  }, []);

  useEffect(() => cancel, [cancel]);

  return useMemo(() => ({ run, cancel }), [run, cancel]);
}
