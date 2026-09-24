import { Link } from 'react-router';
import type { Order } from '../../api';
import { buttonClass } from '../../ui/Button';
import { Notice } from '../../ui/Notice';
import { DeliveryDetails } from './DeliveryDetails';

export function OrderSuccess({ order }: { order: Order }) {
  const cash = order.paymentMethod === 'cash_on_delivery';
  return (
    <div className="success">
      <Notice
        tone="success"
        title={cash ? 'Заказ оформлен, оплата при получении' : 'Заказ оплачен'}
        action={
          <Link to="/" className={buttonClass('secondary')}>
            Продолжить покупки
          </Link>
        }
      >
        <p>
          Номер заказа: <strong>{order.number}</strong>
        </p>
      </Notice>
      <section className="card">
        <h2>Доставка</h2>
        <DeliveryDetails delivery={order.delivery} />
        <h2>Получатель</h2>
        <p>
          {order.customer.name}, {order.customer.phone}, {order.customer.email}
        </p>
      </section>
    </div>
  );
}
