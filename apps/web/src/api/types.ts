import type { Static } from '@sinclair/typebox';
import type {
  Cart,
  CheckoutOptionsSchema,
  Delivery,
  Payment,
  SandboxSchema,
  SessionSchema,
} from '@checkout/contracts';

export type {
  Cart,
  CreateOrder,
  Customer,
  Delivery,
  Order,
  Payment,
  Product,
  Quote,
  Scenario,
  Simulation,
} from '@checkout/contracts';

export type CartItem = Cart['items'][number];
export type CheckoutOptions = Static<typeof CheckoutOptionsSchema>;
export type DeliveryMethod = Delivery['method'];
export type Sandbox = Static<typeof SandboxSchema>;
export type TestCard = Sandbox['cards'][number];
export type Session = Static<typeof SessionSchema>;
export type PaymentStatus = Payment['status'];
export interface QuoteRequest {
  cartVersion: number;
  delivery: Delivery;
}
