import type { ReactNode } from 'react';
import type { CheckoutOptions } from '../../api';
import { formatMoney, formatShipping } from '../../lib/money';
import { ChoiceGroup, type Choice } from '../../ui/ChoiceGroup';
import { TextField } from '../../ui/TextField';
import type { CheckoutForm } from './useCheckoutForm';
import type { CheckoutValues } from './validation';

type DeliveryOption = CheckoutOptions['deliveryMethods'][number];
type PaymentOption = CheckoutOptions['paymentMethods'][number];

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card form-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function ContactSection({ form }: { form: CheckoutForm }) {
  return (
    <FormSection title="Контакты">
      <TextField label="Имя и фамилия" autoComplete="name" {...form.textField('name')} />
      <TextField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        {...form.textField('email')}
      />
      <TextField
        label="Телефон"
        type="tel"
        autoComplete="tel"
        placeholder="+7 999 000-00-00"
        hint="В международном формате, начиная с +"
        {...form.textField('phone')}
      />
    </FormSection>
  );
}

function deliveryPrice(method: DeliveryOption): string {
  const price = formatShipping(method.price);
  return method.freeFrom === null
    ? price
    : `${price}, бесплатно от ${formatMoney(method.freeFrom)}`;
}

export function DeliverySection({
  form,
  methods,
}: {
  form: CheckoutForm;
  methods: readonly DeliveryOption[];
}) {
  const { values } = form;
  const methodChoices: Choice<CheckoutValues['deliveryMethod']>[] = methods.map((method) => ({
    value: method.id,
    label: method.title,
    description: deliveryPrice(method),
  }));
  const pickupPoints = methods.find((method) => method.id === 'pickup')?.pickupPoints ?? [];

  return (
    <FormSection title="Доставка">
      <ChoiceGroup
        legend="Способ доставки"
        name="deliveryMethod"
        value={values.deliveryMethod}
        options={methodChoices}
        error={form.errorOf('deliveryMethod')}
        onChange={(value) => form.setValue('deliveryMethod', value)}
      />
      {values.deliveryMethod === 'pickup' ? (
        <ChoiceGroup
          legend="Пункт выдачи"
          name="pickupPointId"
          value={values.pickupPointId}
          options={pickupPoints.map((point) => ({
            value: point.id,
            label: point.title,
            description: point.address,
          }))}
          error={form.errorOf('pickupPointId')}
          onChange={(value) => form.setValue('pickupPointId', value)}
          onBlur={() => form.touch('pickupPointId')}
        />
      ) : (
        <div className="address">
          <TextField
            label="Город"
            autoComplete="address-level2"
            className="address__city"
            {...form.textField('city')}
          />
          <TextField
            label="Улица"
            autoComplete="address-line1"
            className="address__street"
            {...form.textField('street')}
          />
          <TextField label="Дом" autoComplete="address-line2" {...form.textField('house')} />
          <TextField
            label="Квартира"
            hint="Необязательно"
            autoComplete="address-line3"
            {...form.textField('apartment')}
          />
        </div>
      )}
    </FormSection>
  );
}

const PAYMENT_HINTS: Record<PaymentOption['id'], string> = {
  card: 'Тестовая карта из списка, без ввода номера',
  cash_on_delivery: 'Заказ подтверждается сразу, онлайн-оплата не нужна',
};

export function PaymentSection({
  form,
  methods,
}: {
  form: CheckoutForm;
  methods: readonly PaymentOption[];
}) {
  return (
    <FormSection title="Оплата">
      <ChoiceGroup
        legend="Способ оплаты"
        name="paymentMethod"
        value={form.values.paymentMethod}
        options={methods.map((method) => ({
          value: method.id,
          label: method.title,
          description: PAYMENT_HINTS[method.id],
        }))}
        error={form.errorOf('paymentMethod')}
        onChange={(value) => form.setValue('paymentMethod', value)}
      />
    </FormSection>
  );
}
