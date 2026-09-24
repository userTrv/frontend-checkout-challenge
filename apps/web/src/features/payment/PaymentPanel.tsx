import { useEffect, useRef, useState } from 'react';
import { api, type Order, type Payment, type Scenario } from '../../api';
import { useResource } from '../../hooks/useResource';
import { formatMoney } from '../../lib/money';
import { Button } from '../../ui/Button';
import { ChoiceGroup } from '../../ui/ChoiceGroup';
import { ErrorNotice, Notice } from '../../ui/Notice';
import { ResourceView } from '../../ui/ResourceView';
import { Loading } from '../../ui/Spinner';
import { usePayment } from './usePayment';

interface PaymentPanelProps {
  order: Order;
  reloadOrder: () => Promise<void>;
}

export function PaymentPanel({ order, reloadOrder }: PaymentPanelProps) {
  const payment = usePayment(order, reloadOrder);
  const { view } = payment;

  return (
    <section className="card payment" aria-labelledby="payment-title">
      <h2 id="payment-title">Оплата картой</h2>
      <div aria-live="polite">
        {view.step === 'checking' && <Loading label="Проверяем статус оплаты…" />}
        {view.step === 'processing' && (
          <Loading label="Ждём подтверждения оплаты от банка. Страницу можно не обновлять." />
        )}
        {view.step === 'succeeded' && <Loading label="Оплата прошла, обновляем заказ…" />}
        {view.step === 'ready' && view.last && <LastAttempt payment={view.last} />}
      </div>

      {view.step === 'ready' && (
        <>
          {!view.last && (
            <p>Заказ создан и ждёт оплаты. Сумма к оплате: {formatMoney(order.total)}.</p>
          )}
          <Button loading={payment.busy} onClick={payment.open}>
            {view.last ? 'Оплатить ещё раз' : 'Оплатить картой'}
          </Button>
        </>
      )}

      {view.step === 'form' && (
        <TestPaymentForm
          amount={view.payment.amount}
          busy={payment.busy}
          onPay={payment.pay}
          onCancel={payment.cancel}
        />
      )}

      <ErrorNotice
        error={payment.error}
        title="Не удалось выполнить шаг оплаты"
        onRetry={payment.retry}
      />
    </section>
  );
}

function LastAttempt({ payment }: { payment: Payment }) {
  return payment.status === 'failed' ? (
    <Notice tone="error" title="Банк отклонил оплату">
      Деньги не списаны, заказ сохранён. Можно попробовать ещё раз, например с другой картой.
    </Notice>
  ) : (
    <Notice tone="warning" title="Оплата отменена">
      Заказ сохранён и ждёт оплаты. Вы можете оплатить его, когда будете готовы.
    </Notice>
  );
}

interface TestPaymentFormProps {
  amount: number;
  busy: boolean;
  onPay: (scenario: Scenario) => void;
  onCancel: () => void;
}

function TestPaymentForm({ amount, busy, onPay, onCancel }: TestPaymentFormProps) {
  const sandbox = useResource(api.sandbox, []);
  const [cardId, setCardId] = useState('');
  const [showError, setShowError] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => titleRef.current?.focus(), []);

  return (
    <div className="test-form">
      <h3 ref={titleRef} tabIndex={-1} className="test-form__title">
        Тестовая платёжная форма
      </h3>
      <p className="hint">Настоящие карты не принимаются: выберите тестовую карту из списка.</p>
      <ResourceView resource={sandbox} loadingLabel="Загружаем тестовые карты…">
        {({ cards }) => {
          const card = cards.find((item) => item.id === cardId);
          const pay = () => (card ? onPay(card.scenario) : setShowError(true));
          return (
            <>
              <ChoiceGroup
                legend="Карта"
                name="card"
                value={cardId}
                options={cards.map((item) => ({
                  value: item.id,
                  label: item.maskedNumber,
                  description: item.title,
                }))}
                error={showError && !card ? 'Выберите карту' : undefined}
                onChange={setCardId}
              />
              <div className="actions">
                <Button loading={busy} onClick={pay}>
                  Оплатить {formatMoney(amount)}
                </Button>
                <Button variant="secondary" loading={busy} onClick={onCancel}>
                  Отменить оплату
                </Button>
              </div>
            </>
          );
        }}
      </ResourceView>
    </div>
  );
}
