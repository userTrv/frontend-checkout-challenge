import { memo } from 'react';
import { useAction } from '../../hooks/useAction';
import { Button } from '../../ui/Button';
import { ErrorNotice } from '../../ui/Notice';
import { QuantityStepper } from '../../ui/QuantityStepper';
import { useCartActions } from './CartProvider';

interface CartControlsProps {
  productId: string;
  title: string;
  quantity: number;
  stock: number;
  showRemove?: boolean;
}

export const CartControls = memo(function CartControls({
  productId,
  title,
  quantity,
  stock,
  showRemove = false,
}: CartControlsProps) {
  const { setQuantity } = useCartActions();
  const change = useAction((next: number) => setQuantity(productId, next));
  const setTo = (next: number) => void change.run(next);

  return (
    <div className="cart-controls">
      <div className="cart-controls__row">
        {quantity === 0 ? (
          <Button loading={change.pending} disabled={stock === 0} onClick={() => setTo(1)}>
            {stock === 0 ? 'Нет в наличии' : 'В корзину'}
          </Button>
        ) : (
          <QuantityStepper
            label={`Количество: ${title}`}
            value={quantity}
            max={Math.max(stock, quantity)}
            busy={change.pending}
            onChange={setTo}
          />
        )}
        {showRemove && quantity > 0 && (
          <Button variant="ghost" loading={change.pending} onClick={() => setTo(0)}>
            Удалить
          </Button>
        )}
      </div>
      {quantity > stock && (
        <p className="hint hint--warning">Доступно только {stock} шт. Уменьшите количество.</p>
      )}
      {quantity > 0 && quantity === stock && <p className="hint">Это весь доступный остаток.</p>}
      <ErrorNotice error={change.error} />
    </div>
  );
});
