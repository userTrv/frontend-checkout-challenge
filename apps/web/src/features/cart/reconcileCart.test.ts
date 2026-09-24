import { describe, expect, it } from 'vitest';
import type { Cart, CartItem } from '../../api';
import { reconcileCart } from './reconcileCart';

const item = (productId: string, quantity: number): CartItem => ({
  productId,
  title: productId,
  unitPrice: 100,
  quantity,
  lineTotal: quantity * 100,
});

const cart = (version: number, items: CartItem[]): Cart => ({
  id: 'c1',
  version,
  items,
  quantity: items.reduce((sum, i) => sum + i.quantity, 0),
  subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0),
  currency: 'RUB',
});

describe('reconcileCart', () => {
  it('returns the previous cart when nothing changed', () => {
    const previous = cart(3, [item('a', 1), item('b', 2)]);
    const next = cart(3, [item('a', 1), item('b', 2)]);
    expect(reconcileCart(previous, next)).toBe(previous);
  });

  it('keeps references to unchanged items and takes changed ones', () => {
    const previous = cart(3, [item('a', 1), item('b', 2)]);
    const next = cart(4, [item('a', 1), item('b', 3)]);
    const merged = reconcileCart(previous, next);
    expect(merged.version).toBe(4);
    expect(merged.items[0]).toBe(previous.items[0]);
    expect(merged.items[1]).toBe(next.items[1]);
  });

  it('matches items by id after a removal shifts positions', () => {
    const previous = cart(3, [item('a', 1), item('b', 2), item('c', 1)]);
    const next = cart(4, [item('b', 2), item('c', 1)]);
    const merged = reconcileCart(previous, next);
    expect(merged.items).toHaveLength(2);
    expect(merged.items[0]).toBe(previous.items[1]);
    expect(merged.items[1]).toBe(previous.items[2]);
  });

  it('handles an emptied cart', () => {
    const previous = cart(3, [item('a', 1)]);
    const merged = reconcileCart(previous, cart(4, []));
    expect(merged.items).toEqual([]);
    expect(merged.subtotal).toBe(0);
  });
});
