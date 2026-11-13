// Dari Fokus_Backend/lib/report.ts: ambil pembayaran lunas pada rentang tanggal (zona Asia/Jakarta).
import { supabase } from './supabase';
import { subtotalOf } from './domain';

export type PaidRow = { no: string; at: string; table: number | null; src: string; method: string; total: number; subtotal: number };

export const fetchPaid = async (from: string, to: string, method = 'all'): Promise<PaidRow[]> => {
  let q = supabase
    .from('payments')
    .select('method,amount,paid_at,orders(order_number,order_source,table_sessions(tables(table_number)))')
    .eq('status', 'paid')
    .gte('paid_at', from + 'T00:00:00+07:00')
    .lte('paid_at', to + 'T23:59:59+07:00')
    .order('paid_at', { ascending: false });
  if (method !== 'all') q = q.eq('method', method);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    no: p.orders.order_number,
    at: p.paid_at,
    table: p.orders.table_sessions?.tables?.table_number ?? null,
    src: p.orders.order_source,
    method: p.method,
    total: Number(p.amount),
    subtotal: subtotalOf(Number(p.amount)),
  }));
};
