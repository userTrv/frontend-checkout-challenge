import { useEffect, useMemo, useRef, type FormEvent } from 'react';
import { api, type Cart, type CheckoutOptions } from '../api';
import { useCart, useCartActions } from '../features/cart/CartProvider';
import { EmptyCart } from '../features/cart/EmptyCart';
import { CheckoutSummary } from '../features/checkout/CheckoutSummary';
import { ContactSection, DeliverySection, PaymentSection } from '../features/checkout/sections';
import { useCheckoutForm } from '../features/checkout/useCheckoutForm';
import { useQuote } from '../features/checkout/useQuote';
import {
  isStaleCheckout,
  useResumeUnansweredOrder,
  useSubmitOrder,
} from '../features/checkout/useSubmitOrder';
import { toDelivery } from '../features/checkout/validation';
import { usePageTitle } from '../hooks/usePageTitle';
import { useResource } from '../hooks/useResource';
import { focusFirstInvalid } from '../lib/dom';
import { Button } from '../ui/Button';
import { ErrorNotice, Notice } from '../ui/Notice';
import { Loading } from '../ui/Spinner';
import { ResourceView } from '../ui/ResourceView';

export function CheckoutPage() {
  const cart = useCart();
  const { refresh } = useCartActions();
  const options = useResource(api.checkoutOptions, []);
  const resumed = useResumeUnansweredOrder();
  usePageTitle('Оформление заказа');
  useEffect(() => void refresh(), [refresh]);

  if (resumed.pending) return <Loading label="Проверяем отправленный ранее заказ…" />;

  return (
    <section aria-labelledby="checkout-title">
      <h1 id="checkout-title">Оформление заказа</h1>
      <ErrorNotice
        error={resumed.error}
        title="Не удалось узнать, создан ли отправленный заказ"
        onRetry={resumed.retry}
      />
      <ResourceView resource={cart} loadingLabel="Загружаем корзину…">
        {(cartData) =>
          cartData.items.length === 0 ? (
            <EmptyCart />
          ) : (
            <ResourceView resource={options} loadingLabel="Загружаем способы доставки…">
              {(optionsData) => <CheckoutContent cart={cartData} options={optionsData} />}
            </ResourceView>
          )
        }
      </ResourceView>
    </section>
  );
}

function CheckoutContent({ cart, options }: { cart: Cart; options: CheckoutOptions }) {
  const form = useCheckoutForm();
  const formRef = useRef<HTMLFormElement>(null);
  const delivery = useMemo(() => toDelivery(form.values), [form.values]);
  const quote = useQuote(cart.version, delivery);
  const order = useSubmitOrder(form, quote);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!order.submit()) focusFirstInvalid(formRef.current);
  };

  return (
    <div className="two-columns">
      <form
        id="checkout-form"
        ref={formRef}
        className="checkout-form"
        noValidate
        onSubmit={handleSubmit}
      >
        <ContactSection form={form} />
        <DeliverySection form={form} methods={options.deliveryMethods} />
        <PaymentSection form={form} methods={options.paymentMethods} />
      </form>
      <CheckoutSummary cart={cart} quote={quote} deliveryChosen={delivery !== null}>
        {isStaleCheckout(order.error) ? (
          <Notice tone="warning" title="Данные изменились">
            Корзина или расчёт доставки обновились. Проверьте сумму и подтвердите заказ ещё раз.
          </Notice>
        ) : (
          <ErrorNotice error={order.error} title="Не удалось оформить заказ" />
        )}
        <Button
          type="submit"
          form="checkout-form"
          className="summary__action"
          loading={order.pending || quote.calculating}
        >
          {form.values.paymentMethod === 'card' ? 'Перейти к оплате' : 'Оформить заказ'}
        </Button>
      </CheckoutSummary>
    </div>
  );
}
