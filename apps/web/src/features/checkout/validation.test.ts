import { describe, expect, it } from 'vitest';
import { ApiError } from '../../api';
import {
  EMPTY_CHECKOUT,
  fieldErrorsFrom,
  toCustomer,
  toDelivery,
  validate,
  type CheckoutValues,
} from './validation';

const filled: CheckoutValues = {
  ...EMPTY_CHECKOUT,
  name: 'Тестовый Покупатель',
  email: 'buyer@example.test',
  phone: '+7 (999) 000-00-00',
  pickupPointId: 'point-center',
};

describe('checkout validation', () => {
  it('accepts a complete pickup form', () => {
    expect(validate(filled)).toEqual({});
  });

  it('reports each invalid field once', () => {
    const errors = validate({ ...filled, name: ' ', email: 'buyer@', phone: '89990000000' });
    expect(Object.keys(errors).sort()).toEqual(['email', 'name', 'phone']);
  });

  it('checks the address only for courier delivery', () => {
    expect(validate({ ...filled, deliveryMethod: 'courier' })).toMatchObject({
      city: 'Укажите город',
      street: 'Укажите улицу',
      house: 'Укажите дом',
    });
    expect(validate({ ...filled, city: '' }).city).toBeUndefined();
  });

  it('builds request parts in the API format', () => {
    expect(toCustomer(filled).phone).toBe('+79990000000');
    expect(toDelivery(filled)).toEqual({ method: 'pickup', pickupPointId: 'point-center' });
    expect(
      toDelivery({
        ...filled,
        deliveryMethod: 'courier',
        city: ' Учебный ',
        street: 'Примерная',
        house: '10',
      }),
    ).toEqual({
      method: 'courier',
      address: { city: 'Учебный', street: 'Примерная', house: '10' },
    });
    expect(toDelivery({ ...filled, pickupPointId: '' })).toBeNull();
  });

  it('maps server field paths to form fields', () => {
    const error = new ApiError({
      kind: 'http',
      status: 400,
      fields: [
        { path: 'body/customer/email', message: 'must match format email' },
        { path: 'body/unknown', message: 'x' },
      ],
    });
    expect(Object.keys(fieldErrorsFrom(error))).toEqual(['email']);
  });
});
