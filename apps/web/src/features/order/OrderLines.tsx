import type { CartItem } from '../../api';
import { formatMoney } from '../../lib/money';

export function OrderLines({ items }: { items: readonly CartItem[] }) {
  return (
    <ul className="lines">
      {items.map((item) => (
        <li key={item.productId} className="lines__item">
          <span>
            {item.title} <span className="lines__quantity">× {item.quantity}</span>
          </span>
          <span className="lines__total">{formatMoney(item.lineTotal)}</span>
        </li>
      ))}
    </ul>
  );
}
