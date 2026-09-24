import type { ReactNode } from 'react';
import type { Cart } from '../../api';
import { formatShipping } from '../../lib/money';
import { ErrorNotice } from '../../ui/Notice';
import { Loading } from '../../ui/Spinner';
import { Totals } from '../../ui/Totals';
import { OrderLines } from '../order/OrderLines';
import type { QuoteState } from './useQuote';

interface CheckoutSummaryProps {
  cart: Cart;
  quote: QuoteState;
  deliveryChosen: boolean;
  children?: ReactNode;
}

export function CheckoutSummary({ cart, quote, deliveryChosen, children }: CheckoutSummaryProps) {
  const current = quote.quote;
  const shipping = current
    ? formatShipping(current.shipping)
    : deliveryChosen
      ? 'Считаем…'
      : 'Выберите доставку';

  return (
    <aside className="card summary" aria-label="Ваш заказ">
      <h2>Ваш заказ</h2>
      <OrderLines items={cart.items} />
      <Totals
        rows={[
          { label: 'Товары', value: current?.subtotal ?? cart.subtotal },
          { label: 'Доставка', value: shipping },
          { label: 'Итого', value: current?.total ?? '—', strong: true },
        ]}
      />
      <div aria-live="polite">
        {quote.calculating && <Loading label="Рассчитываем стоимость доставки…" />}
        {quote.cartChanged ? (
          <p className="hint">Корзина изменилась, обновляем расчёт…</p>
        ) : (
          <ErrorNotice
            error={quote.error}
            title="Не удалось рассчитать доставку"
            onRetry={() => void quote.recalculate()}
          />
        )}
      </div>
      {children}
    </aside>
  );
}
