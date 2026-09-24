import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { api, hasErrorCode } from '../../api';
import { useResource } from '../../hooks/useResource';
import { Notice } from '../../ui/Notice';
import { currentOrder } from './currentOrder';

export function CurrentOrderBanner() {
  const { pathname } = useLocation();
  const orderId = currentOrder.get();
  const visible = orderId !== null && !pathname.startsWith(`/orders/${orderId}`);
  const order = useResource(visible ? (signal) => api.order(orderId, signal) : null, [
    visible,
    orderId,
  ]);

  const status = order.data?.status;
  const gone = hasErrorCode(order.error, 'ORDER_NOT_FOUND');
  useEffect(() => {
    if (orderId && (gone || (status && status !== 'awaiting_payment'))) currentOrder.clear(orderId);
  }, [orderId, gone, status]);

  if (!visible || status !== 'awaiting_payment') return null;
  return (
    <Notice tone="info" action={<Link to={`/orders/${orderId}`}>Перейти к оплате</Link>}>
      Заказ {order.data?.number} ждёт оплаты.
    </Notice>
  );
}
