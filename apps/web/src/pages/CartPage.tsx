import { memo, useEffect } from 'react';
import { Link } from 'react-router';
import type { Cart, CartItem } from '../api';
import { CartControls } from '../features/cart/CartControls';
import { EmptyCart } from '../features/cart/EmptyCart';
import { useCart, useCartActions } from '../features/cart/CartProvider';
import { MAX_ITEM_QUANTITY } from '../features/cart/limits';
import { useCatalog } from '../features/catalog/CatalogProvider';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatMoney } from '../lib/money';
import { buttonClass } from '../ui/Button';
import { ResourceView } from '../ui/ResourceView';
import { Totals } from '../ui/Totals';

export function CartPage() {
  const cart = useCart();
  const { refresh } = useCartActions();
  usePageTitle('Корзина');
  useEffect(() => void refresh(), [refresh]);

  return (
    <section aria-labelledby="cart-title">
      <h1 id="cart-title">Корзина</h1>
      <ResourceView resource={cart} loadingLabel="Загружаем корзину…">
        {(data) => (data.items.length === 0 ? <EmptyCart /> : <CartContents cart={data} />)}
      </ResourceView>
    </section>
  );
}

function CartContents({ cart }: { cart: Cart }) {
  const { productsById } = useCatalog();
  return (
    <div className="two-columns">
      <ul className="cart-list">
        {cart.items.map((item) => (
          <CartRow
            key={item.productId}
            item={item}
            stock={productsById.get(item.productId)?.stock ?? MAX_ITEM_QUANTITY}
          />
        ))}
      </ul>
      <aside className="card summary" aria-label="Итог корзины">
        <Totals
          rows={[
            { label: 'Товаров', value: `${cart.quantity} шт.` },
            { label: 'Сумма', value: cart.subtotal, strong: true },
          ]}
        />
        <p className="hint">Стоимость доставки рассчитаем при оформлении.</p>
        <Link to="/checkout" className={buttonClass('primary', 'summary__action')}>
          Перейти к оформлению
        </Link>
      </aside>
    </div>
  );
}

const CartRow = memo(function CartRow({ item, stock }: { item: CartItem; stock: number }) {
  return (
    <li className="card cart-row">
      <div className="cart-row__info">
        <h2 className="cart-row__title">{item.title}</h2>
        <p className="hint">{formatMoney(item.unitPrice)} за шт.</p>
      </div>
      <CartControls
        productId={item.productId}
        title={item.title}
        quantity={item.quantity}
        stock={stock}
        showRemove
      />
      <p className="cart-row__total">{formatMoney(item.lineTotal)}</p>
    </li>
  );
});
