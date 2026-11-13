/**
 * Functional Payment Settlement Pipeline (JavaScript).
 * Handles payment confirmation, atomic session closure, and change computation.
 */

import { supabase } from '../supabase.js';
import { ok, err } from '../fp/result.js';

export const methodToDb = (method) => {
  const map = {
    Tunai: 'cash',
    cash: 'cash',
    QRIS: 'qris',
    qris: 'qris',
    Debit: 'debit',
    debit: 'debit',
    'Kartu Debit': 'debit',
  };
  return map[method] || 'cash';
};

/**
 * Functional pipeline: settles an open table session
 * @param {object} input
 * @param {number} input.sessionId
 * @param {string} input.method
 * @param {number} [input.amountReceived]
 */
export const settleSessionPayment = async (input) => {
  try {
    const dbMethod = methodToDb(input.method);
    const { data, error } = await supabase.rpc('pay_session', {
      p_session: Number(input.sessionId),
      p_method: dbMethod,
      p_received: input.amountReceived ? Number(input.amountReceived) : null,
    });

    if (error || data?.error) {
      return err(error?.message || data?.error || 'Gagal memproses pembayaran');
    }

    return ok({
      success: true,
      total: Number(data.total),
      change: Number(data.change),
      settledOrders: data.orders || [],
    });
  } catch (e) {
    return err(`Gagal memproses pembayaran: ${String(e)}`);
  }
};
