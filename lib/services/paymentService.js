/**
 * Functional Payment Settlement Pipeline (JavaScript).
 * Handles payment confirmation, atomic session closure, and change computation.
 * Clean Code & Security Audit: Safe error handling without leaking internal database exceptions.
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
    const sessionId = Number(input?.sessionId);
    if (!Number.isFinite(sessionId) || sessionId <= 0) {
      return err('ID sesi tidak valid');
    }

    const dbMethod = methodToDb(input?.method);
    const amountReceived = input?.amountReceived !== undefined && input?.amountReceived !== null
      ? Number(input.amountReceived)
      : null;

    if (amountReceived !== null && (!Number.isFinite(amountReceived) || amountReceived < 0)) {
      return err('Nominal pembayaran tidak valid');
    }

    const { data, error } = await supabase.rpc('pay_session', {
      p_session: sessionId,
      p_method: dbMethod,
      p_received: amountReceived,
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
    console.error('[PaymentService:settleSessionPayment] Unexpected error:', e);
    return err('Terjadi kesalahan internal saat memproses pembayaran');
  }
};
