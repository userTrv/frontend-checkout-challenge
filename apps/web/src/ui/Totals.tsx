import type { ReactNode } from 'react';
import { formatMoney } from '../lib/money';

export interface TotalRow {
  label: ReactNode;
  value: number | string;
  strong?: boolean;
}

export function Totals({ rows }: { rows: readonly TotalRow[] }) {
  return (
    <dl className="totals">
      {rows.map((row, index) => (
        <div key={index} className={row.strong ? 'totals__row totals__row--strong' : 'totals__row'}>
          <dt>{row.label}</dt>
          <dd>{typeof row.value === 'number' ? formatMoney(row.value) : row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
