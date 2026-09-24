import type { ApiError, Customer, Delivery, DeliveryMethod, Order } from '../../api';

export interface CheckoutValues {
  name: string;
  email: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  pickupPointId: string;
  city: string;
  street: string;
  house: string;
  apartment: string;
  paymentMethod: Order['paymentMethod'];
}

export type CheckoutField = keyof CheckoutValues;
export type FieldErrors = Partial<Record<CheckoutField, string>>;

export const EMPTY_CHECKOUT: CheckoutValues = {
  name: '',
  email: '',
  phone: '',
  deliveryMethod: 'pickup',
  pickupPointId: '',
  city: '',
  street: '',
  house: '',
  apartment: '',
  paymentMethod: 'card',
};

type Rule = (value: string, values: CheckoutValues) => string | undefined;

const required =
  (message: string): Rule =>
  (value) =>
    value.trim() ? undefined : message;

const length =
  (min: number, max: number, message: string): Rule =>
  (value) => {
    const size = value.trim().length;
    return size < min || size > max ? message : undefined;
  };

const matches =
  (pattern: RegExp, message: string, normalize: (value: string) => string = (v) => v): Rule =>
  (value) =>
    pattern.test(normalize(value)) ? undefined : message;

const onlyFor =
  (method: DeliveryMethod, ...rules: Rule[]): Rule =>
  (value, values) => {
    if (values.deliveryMethod !== method) return undefined;
    for (const rule of rules) {
      const message = rule(value, values);
      if (message) return message;
    }
    return undefined;
  };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+[1-9]\d{9,14}$/;

export const normalizePhone = (value: string) => value.replace(/[\s()-]/g, '');

const RULES: Record<CheckoutField, readonly Rule[]> = {
  name: [required('Укажите имя'), length(2, 100, 'Имя — от 2 до 100 символов')],
  email: [
    required('Укажите email'),
    length(3, 150, 'Email — не длиннее 150 символов'),
    matches(EMAIL, 'Проверьте email, например buyer@example.test', (v) => v.trim()),
  ],
  phone: [
    required('Укажите телефон'),
    matches(PHONE, 'Телефон в формате +79990000000', normalizePhone),
  ],
  deliveryMethod: [required('Выберите способ доставки')],
  pickupPointId: [onlyFor('pickup', required('Выберите пункт выдачи'))],
  city: [onlyFor('courier', required('Укажите город'), length(2, 100, 'Город — от 2 символов'))],
  street: [onlyFor('courier', required('Укажите улицу'), length(2, 150, 'Улица — от 2 символов'))],
  house: [onlyFor('courier', required('Укажите дом'), length(1, 20, 'Дом — до 20 символов'))],
  apartment: [onlyFor('courier', length(0, 20, 'Квартира — до 20 символов'))],
  paymentMethod: [required('Выберите способ оплаты')],
};

const ALL_FIELDS = Object.keys(RULES) as CheckoutField[];
const DELIVERY_FIELDS: readonly CheckoutField[] = [
  'deliveryMethod',
  'pickupPointId',
  'city',
  'street',
  'house',
  'apartment',
];

export function validate(
  values: CheckoutValues,
  fields: readonly CheckoutField[] = ALL_FIELDS,
): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of fields) {
    for (const rule of RULES[field]) {
      const message = rule(values[field], values);
      if (message) {
        errors[field] = message;
        break;
      }
    }
  }
  return errors;
}

export const hasErrors = (errors: FieldErrors) => Object.keys(errors).length > 0;

export function toDelivery(values: CheckoutValues): Delivery | null {
  if (hasErrors(validate(values, DELIVERY_FIELDS))) return null;
  if (values.deliveryMethod === 'pickup') {
    return { method: 'pickup', pickupPointId: values.pickupPointId };
  }
  const apartment = values.apartment.trim();
  return {
    method: 'courier',
    address: {
      city: values.city.trim(),
      street: values.street.trim(),
      house: values.house.trim(),
      ...(apartment ? { apartment } : {}),
    },
  };
}

export function toCustomer(values: CheckoutValues): Customer {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: normalizePhone(values.phone),
  };
}

const FIELD_BY_SERVER_PATH: Record<string, CheckoutField> = {
  'body/customer/name': 'name',
  'body/customer/email': 'email',
  'body/customer/phone': 'phone',
  'body/delivery/pickupPointId': 'pickupPointId',
  'body/delivery/address/city': 'city',
  'body/delivery/address/street': 'street',
  'body/delivery/address/house': 'house',
  'body/delivery/address/apartment': 'apartment',
  'body/paymentMethod': 'paymentMethod',
};

export function fieldErrorsFrom(error: ApiError | null): FieldErrors {
  const errors: FieldErrors = {};
  if (!error) return errors;
  for (const issue of error.fields) {
    const field = FIELD_BY_SERVER_PATH[issue.path];
    if (field) errors[field] ??= 'Сервер не принял это значение. Проверьте поле.';
  }
  return errors;
}
