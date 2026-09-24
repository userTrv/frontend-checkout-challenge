import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { api, ApiError, hasErrorCode, type CreateOrder } from '../../api';
import { useAction } from '../../hooks/useAction';
import { IdempotentRequest } from '../../lib/idempotency';
import { tabStore } from '../../lib/storage';
import { useCartActions } from '../cart/CartProvider';
import { currentOrder } from '../order/currentOrder';
import { clearCheckoutDraft, type CheckoutForm } from './useCheckoutForm';
import type { QuoteState } from './useQuote';
import { fieldErrorsFrom, toCustomer } from './validation';

const orderRequest = new IdempotentRequest<CreateOrder>({
  store: tabStore,
  key: 'checkout.pendingOrder',
});

const STALE_CODES = ['QUOTE_EXPIRED', 'QUOTE_NOT_FOUND', 'CART_VERSION_CONFLICT', 'CART_EMPTY'];

export const isStaleCheckout = (error: ApiError | null) => hasErrorCode(error, ...STALE_CODES);

function usePlaceOrder() {
  const navigate = useNavigate();
  const { refresh: refreshCart } = useCartActions();
  return useCallback(
    async (body: CreateOrder) => {
      const order = await orderRequest.send(body, api.createOrder);
      currentOrder.set(order.id);
      clearCheckoutDraft();
      void refreshCart();
      navigate(`/orders/${order.id}`, { replace: true });
      return order;
    },
    [navigate, refreshCart],
  );
}

export function useSubmitOrder(form: CheckoutForm, quote: QuoteState) {
  const placeOrder = usePlaceOrder();
  const { refresh: refreshCart } = useCartActions();

  const action = useAction(async (body: CreateOrder) => {
    try {
      return await placeOrder(body);
    } catch (error) {
      if (error instanceof ApiError) form.setServerErrors(fieldErrorsFrom(error));
      if (hasErrorCode(error, ...STALE_CODES)) {
        void refreshCart();
        void quote.recalculate();
      }
      throw error;
    }
  });

  const submit = (): boolean => {
    if (!form.submit()) return false;
    if (quote.quote) {
      void action.run({
        quoteId: quote.quote.id,
        paymentMethod: form.values.paymentMethod,
        customer: toCustomer(form.values),
      });
    } else if (quote.error) {
      void quote.recalculate();
    }
    return true;
  };

  return { submit, pending: action.pending, error: action.error };
}

export function useResumeUnansweredOrder() {
  const action = useAction(usePlaceOrder());
  const { run } = action;

  const resume = useCallback(() => {
    const unanswered = orderRequest.unanswered;
    if (unanswered) void run(unanswered.body);
  }, [run]);

  useEffect(resume, [resume]);

  return { pending: action.pending, error: action.error, retry: resume };
}
