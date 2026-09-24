import { createHttpClient } from './http';
import { createSessionAuth } from './session';
import type {
  Cart,
  CartItem,
  CheckoutOptions,
  CreateOrder,
  Order,
  Payment,
  Product,
  Quote,
  QuoteRequest,
  Sandbox,
  Scenario,
  Session,
  Simulation,
} from './types';

export * from './errors';
export type * from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const DEFAULT_RETRY_AFTER_MS = 1000;

const http = createHttpClient({
  baseUrl: API_URL,
  auth: createSessionAuth(() =>
    http
      .request<Session>('/api/sessions', { method: 'POST', body: {}, public: true })
      .then((session) => session.token),
  ),
});

const cartItemPath = (productId: string) => `/api/cart/items/${encodeURIComponent(productId)}`;

export const api = {
  products: (signal?: AbortSignal) =>
    http.request<Product[]>('/api/products', { public: true, signal }),
  sandbox: (signal?: AbortSignal) =>
    http.request<Sandbox>('/api/sandbox', { public: true, signal }),

  cart: (signal?: AbortSignal) => http.request<Cart>('/api/cart', { signal }),
  setCartItem: (productId: string, quantity: number) =>
    http.request<CartItem>(cartItemPath(productId), { method: 'PUT', body: { quantity } }),
  removeCartItem: (productId: string) =>
    http.request<void>(cartItemPath(productId), { method: 'DELETE' }),

  checkoutOptions: (signal?: AbortSignal) =>
    http.request<CheckoutOptions>('/api/checkout/options', { signal }),
  createQuote: (body: QuoteRequest, signal?: AbortSignal) =>
    http.request<Quote>('/api/quotes', { method: 'POST', body, signal }),

  createOrder: (body: CreateOrder, idempotencyKey: string) =>
    http.request<Order>('/api/orders', { method: 'POST', body, idempotencyKey }),
  order: (orderId: string, signal?: AbortSignal) =>
    http.request<Order>(`/api/orders/${orderId}`, { signal }),

  payments: (orderId: string, signal?: AbortSignal) =>
    http.request<Payment[]>(`/api/orders/${orderId}/payments`, { signal }),
  createPayment: (orderId: string, idempotencyKey: string) =>
    http.request<Payment>(`/api/orders/${orderId}/payments`, {
      method: 'POST',
      body: {},
      idempotencyKey,
    }),
  payment: (paymentId: string, signal?: AbortSignal) =>
    http.request<Payment>(`/api/payments/${paymentId}`, { signal }),
  async simulatePayment(paymentId: string, scenario: Scenario) {
    const { data, headers } = await http.send<Simulation>(
      `/api/payments/${paymentId}/simulations`,
      { method: 'POST', body: { scenario } },
    );
    const seconds = Number(headers.get('Retry-After'));
    return {
      simulation: data,
      retryAfterMs: seconds > 0 ? seconds * 1000 : DEFAULT_RETRY_AFTER_MS,
    };
  },
};
