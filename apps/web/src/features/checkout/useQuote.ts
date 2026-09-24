import { useEffect } from 'react';
import { api, hasErrorCode, type Delivery, type Quote, type QuoteRequest } from '../../api';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useResource } from '../../hooks/useResource';
import { useCartActions } from '../cart/CartProvider';

const TYPING_DEBOUNCE_MS = 400;
const EXPIRY_MARGIN_MS = 15_000;

interface QuoteEntry {
  key: string;
  quote: Quote;
}

export function useQuote(cartVersion: number, delivery: Delivery | null) {
  const { refresh: refreshCart } = useCartActions();
  const request: QuoteRequest | null = delivery && { cartVersion, delivery };
  const key = request && JSON.stringify(request);
  const requestedKey = useDebouncedValue(key, TYPING_DEBOUNCE_MS);

  const resource = useResource<QuoteEntry>(
    requestedKey
      ? async (signal) => {
          try {
            const body = JSON.parse(requestedKey) as QuoteRequest;
            return { key: requestedKey, quote: await api.createQuote(body, signal) };
          } catch (error) {
            if (hasErrorCode(error, 'CART_VERSION_CONFLICT', 'CART_EMPTY')) void refreshCart();
            throw error;
          }
        }
      : null,
    [requestedKey, refreshCart],
  );

  const { data: entry, reload } = resource;
  useEffect(() => {
    if (!entry) return;
    const expiresIn = Date.parse(entry.quote.expiresAt) - Date.now() - EXPIRY_MARGIN_MS;
    const timer = setTimeout(() => void reload(), Math.max(expiresIn, 0));
    return () => clearTimeout(timer);
  }, [entry, reload]);

  const quote = entry && entry.key === key ? entry.quote : undefined;
  return {
    quote,
    calculating: key !== null && !quote && !resource.error,
    error: quote ? null : resource.error,
    cartChanged: hasErrorCode(resource.error, 'CART_VERSION_CONFLICT'),
    recalculate: reload,
  };
}

export type QuoteState = ReturnType<typeof useQuote>;
