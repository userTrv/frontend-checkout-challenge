import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { api, type Cart, type CartItem } from '../../api';
import { useResource, type Resource } from '../../hooks/useResource';
import { indexBy } from '../../lib/collections';
import { reconcileCart } from './reconcileCart';

interface CartState extends Resource<Cart> {
  itemsById: ReadonlyMap<string, CartItem>;
}

export interface CartActions {
  refresh(): Promise<void>;
  setQuantity(productId: string, quantity: number): Promise<void>;
}

const CartStateContext = createContext<CartState | null>(null);
const CartActionsContext = createContext<CartActions | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useResource(api.cart, [], reconcileCart);
  const { reload } = cart;
  const items = cart.data?.items;
  const itemsById = useMemo(() => indexBy(items ?? [], (item) => item.productId), [items]);
  const state = useMemo<CartState>(() => ({ ...cart, itemsById }), [cart, itemsById]);

  const actions = useMemo<CartActions>(
    () => ({
      refresh: reload,
      async setQuantity(productId, quantity) {
        try {
          if (quantity > 0) await api.setCartItem(productId, quantity);
          else await api.removeCartItem(productId);
        } finally {
          await reload();
        }
      },
    }),
    [reload],
  );

  return (
    <CartActionsContext.Provider value={actions}>
      <CartStateContext.Provider value={state}>{children}</CartStateContext.Provider>
    </CartActionsContext.Provider>
  );
}

function required<T>(value: T | null, name: string): T {
  if (value === null) throw new Error(`${name} is used outside of CartProvider`);
  return value;
}

export const useCart = () => required(useContext(CartStateContext), 'useCart');
export const useCartActions = () => required(useContext(CartActionsContext), 'useCartActions');
