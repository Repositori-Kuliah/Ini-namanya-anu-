/**
 * @rawon-gusti/contracts
 * Shared domain contracts and type definitions across frontend and backend.
 */

export type UserRole = 'admin' | 'staff' | 'kitchen' | 'cashier';

export interface StaffUserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  shift?: string;
  terminal?: string;
}

export type OrderStatus = 'draft' | 'submitted' | 'preparing' | 'ready' | 'served';
export type PaymentMethod = 'cash' | 'qris' | 'debit';
export type PaymentStatus = 'pending' | 'paid';

export interface OrderItemPayload {
  id: number;
  qty: number;
  note?: string;
  extras?: number[];
}

export interface PlaceOrderRequest {
  token: string;
  guestCount: number;
  items: OrderItemPayload[];
  note?: string;
  paymentPreference?: 'qris' | 'cashier';
  idempotencyKey?: string;
}

export interface PlaceOrderResponse {
  success: boolean;
  orderNumber?: string;
  orderId?: number;
  error?: string;
}

export interface ServiceRequestPayload {
  token: string;
  kind: 'waiter' | 'checkout';
}

export interface SettlePaymentPayload {
  sessionId: number;
  method: PaymentMethod;
  amountReceived?: number;
}

