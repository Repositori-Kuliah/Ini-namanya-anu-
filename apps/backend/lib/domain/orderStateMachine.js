/**
 * Pure Functional State Machine for Order Lifecycle (JavaScript).
 * Transition functions without mutable properties.
 */

import { ok, err } from '../fp/result.js';

export const STATUS_TRANSITIONS = Object.freeze({
  draft: 'submitted',
  submitted: 'preparing',
  preparing: 'ready',
  ready: 'served',
  served: null,
});

export const STATUS_LABELS = Object.freeze({
  draft: 'Draf',
  submitted: 'Terkirim ke Dapur',
  preparing: 'Sedang Dimasak',
  ready: 'Siap Diantar',
  served: 'Telah Disajikan',
});

/**
 * Pure transition function: returns Ok(nextStatus) or Err(message)
 * @param {string} current
 */
export const nextOrderStatus = (current) => {
  const next = STATUS_TRANSITIONS[current];
  if (!next) {
    return err(`Status '${current}' sudah tahap akhir dan tidak dapat dimajukan lagi`);
  }
  return ok(next);
};

export const sanitizeNote = (note) => {
  if (!note || typeof note !== 'string') return null;
  const trimmed = note.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 200) : null;
};

export const sanitizeCustomerName = (name) => {
  if (!name || typeof name !== 'string') return null;
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 60) : null;
};

/**
 * Validates if an order session is ready for payment settlement
 * @param {Array<{ status: string, isPaid: boolean }>} orders
 */
export const canSettleSession = (orders) => {
  const unpaid = orders.filter((o) => !o.isPaid);
  if (unpaid.length === 0) {
    return err('Tidak ada tagihan yang belum dibayar pada sesi meja ini');
  }
  const unserved = unpaid.filter((o) => o.status !== 'served');
  if (unserved.length > 0) {
    return err(`Masih ada ${unserved.length} pesanan yang belum disajikan ke meja`);
  }
  return ok(true);
};
