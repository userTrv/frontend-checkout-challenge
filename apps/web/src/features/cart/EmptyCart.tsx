import { Link } from 'react-router';
import { Notice } from '../../ui/Notice';

export function EmptyCart() {
  return (
    <Notice title="Корзина пуста" action={<Link to="/">Перейти в каталог</Link>}>
      Добавьте товары, чтобы оформить заказ.
    </Notice>
  );
}
