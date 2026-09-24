import { useEffect } from 'react';
import { useParams } from 'react-router';
import { api, type Order } from '../api';
import { currentOrder } from '../features/order/currentOrder';
import { OrderLines } from '../features/order/OrderLines';
import { OrderSuccess } from '../features/order/OrderSuccess';
import { PaymentPanel } from '../features/payment/PaymentPanel';
import { usePageTitle } from '../hooks/usePageTitle';
import { useResource } from '../hooks/useResource';
import { formatShipping } from '../lib/money';
import { ResourceView } from '../ui/ResourceView';
import { Totals } from '../ui/Totals';

export function OrderPage() {
  const { orderId = '' } = useParams();
  const order = useResource((signal) => api.order(orderId, signal), [orderId]);
  return (
    <section aria-labelledby="order-title">
      <ResourceView resource={order} loadingLabel="Загружаем заказ…">
        {(data) => <OrderView order={data} reload={order.reload} />}
      </ResourceView>
    </section>
  );
}

const isFinished = (order: Order) => order.status === 'paid' || order.status === 'confirmed';

function OrderView({ order, reload }: { order: Order; reload: () => Promise<void> }) {
  const finished = isFinished(order);
  usePageTitle(`Заказ ${order.number}`);
  useEffect(() => {
    if (finished) currentOrder.clear(order.id);
  }, [finished, order.id]);

  return (
    <>
      <h1 id="order-title">Заказ {order.number}</h1>
      <div className="two-columns">
        {finished ? (
          <OrderSuccess order={order} />
        ) : (
          <PaymentPanel order={order} reloadOrder={reload} />
        )}
        <OrderSummary order={order} />
      </div>
    </>
  );
}

function OrderSummary({ order }: { order: Order }) {
  return (
    <aside className="card summary" aria-label="Состав заказа">
      <h2>Состав заказа</h2>
      <OrderLines items={order.items} />
      <Totals
        rows={[
          { label: 'Товары', value: order.subtotal },
          { label: 'Доставка', value: formatShipping(order.shipping) },
          { label: 'Итого', value: order.total, strong: true },
        ]}
      />
    </aside>
  );
}
