import type { ReactNode } from 'react';
import type { ApiError } from '../api';
import { Button } from './Button';

type Tone = 'info' | 'success' | 'warning' | 'error';

interface NoticeProps {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}

export function Notice({ tone = 'info', title, children, action }: NoticeProps) {
  return (
    <div className={`notice notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {title && <p className="notice__title">{title}</p>}
      {children && <div className="notice__body">{children}</div>}
      {action && <div className="notice__action">{action}</div>}
    </div>
  );
}

interface ErrorNoticeProps {
  error: ApiError | null;
  title?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorNotice({ error, title, onRetry, retryLabel = 'Повторить' }: ErrorNoticeProps) {
  if (!error) return null;
  return (
    <Notice
      tone="error"
      title={title}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        )
      }
    >
      {error.message}
    </Notice>
  );
}
