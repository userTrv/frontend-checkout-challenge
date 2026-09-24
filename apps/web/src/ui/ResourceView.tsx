import type { ReactNode } from 'react';
import type { Resource } from '../hooks/useResource';
import { ErrorNotice } from './Notice';
import { Loading } from './Spinner';

interface ResourceViewProps<T> {
  resource: Resource<T>;
  loadingLabel: string;
  children: (data: T) => ReactNode;
}

export function ResourceView<T>({ resource, loadingLabel, children }: ResourceViewProps<T>) {
  const { data, error, reload } = resource;
  if (data === undefined) {
    return error ? (
      <ErrorNotice error={error} onRetry={() => void reload()} />
    ) : (
      <Loading label={loadingLabel} />
    );
  }
  return (
    <>
      <ErrorNotice error={error} title="Не удалось обновить данные" onRetry={() => void reload()} />
      {children(data)}
    </>
  );
}
