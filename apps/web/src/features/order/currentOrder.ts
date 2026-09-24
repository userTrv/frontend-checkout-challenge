import { persistentStore } from '../../lib/storage';

const CURRENT_ORDER_KEY = 'checkout.currentOrder';

export const currentOrder = {
  get: () => persistentStore.get(CURRENT_ORDER_KEY),
  set: (orderId: string) => persistentStore.set(CURRENT_ORDER_KEY, orderId),
  clear(orderId: string) {
    if (persistentStore.get(CURRENT_ORDER_KEY) === orderId)
      persistentStore.remove(CURRENT_ORDER_KEY);
  },
};
