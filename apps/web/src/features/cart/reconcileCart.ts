import type { Cart, CartItem } from '../../api';
import { indexBy } from '../../lib/collections';

const sameItem = (a: CartItem, b: CartItem) =>
  a.quantity === b.quantity &&
  a.lineTotal === b.lineTotal &&
  a.unitPrice === b.unitPrice &&
  a.title === b.title;

export function reconcileCart(previous: Cart | undefined, next: Cart): Cart {
  if (!previous) return next;
  const before = previous.items;
  let byId: Map<string, CartItem> | undefined;
  let unchanged = before.length === next.items.length;
  const items: CartItem[] = [];

  for (let i = 0; i < next.items.length; i++) {
    const item = next.items[i];
    let old = i < before.length ? before[i] : undefined;
    if (old?.productId !== item.productId) {
      unchanged = false;
      byId ??= indexBy(before, (entry) => entry.productId);
      old = byId.get(item.productId);
    }
    if (old && sameItem(old, item)) {
      items.push(old);
    } else {
      items.push(item);
      unchanged = false;
    }
  }

  if (unchanged && previous.version === next.version && previous.id === next.id) return previous;
  return { ...next, items: unchanged ? before : items };
}
