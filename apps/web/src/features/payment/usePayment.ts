import { useCallback, useEffect, useRef, useState } from 'react';
import { api, hasErrorCode, type Order, type Payment, type Scenario } from '../../api';
import { useAction } from '../../hooks/useAction';
import { useLatestTask } from '../../hooks/useLatestTask';
import { poll } from '../../lib/async';
import { IdempotentRequest } from '../../lib/idempotency';

const POLL_INTERVAL_MS = 1000;

export type PaymentView =
  | { step: 'checking' }
  | { step: 'ready'; last?: Payment }
  | { step: 'form'; payment: Payment }
  | { step: 'processing'; payment: Payment }
  | { step: 'succeeded'; payment: Payment };

const isFinal = (payment: Payment) =>
  payment.status === 'succeeded' || payment.status === 'failed' || payment.status === 'cancelled';

function viewFor(payment: Payment | undefined): PaymentView {
  if (!payment) return { step: 'ready' };
  switch (payment.status) {
    case 'pending':
      return { step: 'form', payment };
    case 'processing':
      return { step: 'processing', payment };
    case 'succeeded':
      return { step: 'succeeded', payment };
    default:
      return { step: 'ready', last: payment };
  }
}

export function usePayment(order: Order, reloadOrder: () => Promise<void>) {
  const [view, setView] = useState<PaymentView>({ step: 'checking' });
  const [attempts] = useState(() => new IdempotentRequest<Record<string, never>>());
  const polling = useLatestTask();
  const action = useAction((step: () => Promise<void>) => step());
  const lastStep = useRef<() => Promise<void>>(null);

  const run = useCallback(
    (step: () => Promise<void>) => {
      lastStep.current = step;
      void action.run(step);
    },
    [action.run],
  );

  const follow = async (payment: Payment, firstCheckInMs: number) => {
    setView({ step: 'processing', payment });
    const result = await polling.run((signal) =>
      poll((pollSignal) => api.payment(payment.id, pollSignal), {
        until: isFinal,
        intervalMs: POLL_INTERVAL_MS,
        initialDelayMs: firstCheckInMs,
        signal,
      }),
    );
    await reloadOrder();
    setView(viewFor(result));
  };

  const show = async (payment: Payment | undefined) => {
    if (payment?.status === 'processing') await follow(payment, 0);
    else setView(viewFor(payment));
  };

  const continueLatest = async () => {
    const [latest] = await api.payments(order.id);
    await show(latest);
  };

  const open = async () => {
    try {
      const payment = await attempts.send({}, (_body, key) => api.createPayment(order.id, key));
      await show(payment);
    } catch (error) {
      if (hasErrorCode(error, 'PAYMENT_IN_PROGRESS')) return continueLatest();
      if (hasErrorCode(error, 'ORDER_ALREADY_PAID')) return reloadOrder();
      throw error;
    }
  };

  const simulate = async (scenario: Scenario) => {
    if (view.step !== 'form') return;
    const { payment } = view;
    try {
      const { simulation, retryAfterMs } = await api.simulatePayment(payment.id, scenario);
      await follow(payment, simulation.status === 'processing' ? retryAfterMs : 0);
    } catch (error) {
      if (hasErrorCode(error, 'PAYMENT_FINALIZED')) return continueLatest();
      throw error;
    }
  };

  useEffect(() => {
    run(order.paymentStatus === 'unpaid' ? async () => setView({ step: 'ready' }) : continueLatest);
  }, [order.id]);

  return {
    view,
    busy: action.pending,
    error: action.error,
    open: () => run(open),
    pay: (scenario: Scenario) => run(() => simulate(scenario)),
    cancel: () => run(() => simulate('cancel')),
    retry: () => lastStep.current && run(lastStep.current),
  };
}
