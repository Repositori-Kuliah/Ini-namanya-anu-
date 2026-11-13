/**
 * Functional Sales and Transaction Report Service (JavaScript).
 * Pure map/filter/reduce pipelines for transaction aggregation.
 */

import { supabase } from '../supabase.js';
import { ok, err } from '../fp/result.js';
import { sum, subtotalOfTotal } from '../domain/billing.js';

export const fetchPaidTransactions = async (from, to, method = 'all') => {
  let query = supabase
    .from('payments')
    .select('payment_id, method, amount, paid_at, orders(order_number, order_source, table_sessions(tables(table_number)))')
    .eq('status', 'paid')
    .gte('paid_at', `${from}T00:00:00+07:00`)
    .lte('paid_at', `${to}T23:59:59+07:00`)
    .order('paid_at', { ascending: false });

  if (method !== 'all') {
    query = query.eq('method', method);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((p) => ({
    no: p.orders?.order_number || '',
    at: p.paid_at,
    table: p.orders?.table_sessions?.tables?.table_number ?? null,
    src: p.orders?.order_source || 'staff',
    method: p.method,
    total: Number(p.amount),
    subtotal: subtotalOfTotal(Number(p.amount)),
  }));
};

/**
 * Pure aggregation function using reduce
 * @param {Array<object>} rows
 */
export const aggregateTransactions = (rows) => {
  const totalSales = sum(rows.map((r) => r.total));
  const totalSubtotal = sum(rows.map((r) => r.subtotal));
  const totalTaxAndService = totalSales - totalSubtotal;
  const transactionCount = rows.length;
  const averageTransaction = transactionCount > 0 ? Math.round(totalSales / transactionCount) : 0;

  const initialMethod = { count: 0, total: 0 };
  const byMethod = rows.reduce(
    (acc, row) => {
      const m = row.method === 'cash' ? 'cash' : row.method === 'qris' ? 'qris' : 'debit';
      if (acc[m]) {
        acc[m] = {
          count: acc[m].count + 1,
          total: acc[m].total + row.total,
        };
      }
      return acc;
    },
    {
      cash: { ...initialMethod },
      qris: { ...initialMethod },
      debit: { ...initialMethod },
    }
  );

  return Object.freeze({
    totalSales,
    totalSubtotal,
    totalTaxAndService,
    transactionCount,
    averageTransaction,
    byMethod,
    rows,
  });
};

/**
 * Functional pipeline to fetch and calculate report
 * @param {string} from YYYY-MM-DD
 * @param {string} to YYYY-MM-DD
 * @param {string} method
 */
export const generateSalesReport = async (from, to, method = 'all') => {
  try {
    const rows = await fetchPaidTransactions(from, to, method);
    const summary = aggregateTransactions(rows);
    return ok(summary);
  } catch (e) {
    return err(`Gagal mengambil data laporan: ${String(e)}`);
  }
};
