// Dari Fokus_Backend/lib/report.ts: ambil pembayaran lunas pada rentang tanggal (zona Asia/Jakarta).
import { supabase } from './supabase';
import { subtotalOf, type BillOptions } from './domain';

export type PaidRow = { no: string; at: string; table: number | null; src: string; method: string; total: number; subtotal: number };

export const fetchPaid = async (from: string, to: string, method = 'all', opts: BillOptions = {}): Promise<PaidRow[]> => {
  let q = supabase
    .from('payments')
    .select('method,amount,paid_at,orders(order_number,order_source,table_sessions(tables(table_number),orders(order_number,order_items(unit_price,quantity))))')
    .eq('status', 'paid')
    .gte('paid_at', from + 'T00:00:00+07:00')
    .lte('paid_at', to + 'T23:59:59+07:00')
    .order('paid_at', { ascending: false });
  if (method !== 'all') q = q.eq('method', method);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((p: any) => {
    // Satu pembayaran = satu sesi meja: subtotal diambil dari SELURUH order sesi.
    const sessionOrders: any[] = p.orders?.table_sessions?.orders ?? [];
    const itemsSubtotal = sessionOrders
      .flatMap((o: any) => o.order_items || [])
      .reduce((acc: number, i: any) => acc + Number(i.unit_price) * Number(i.quantity), 0);
    const amount = Number(p.amount);
    return {
      no: sessionOrders.map((o: any) => o.order_number).filter(Boolean).join(' + ') || p.orders?.order_number || '',
      at: p.paid_at,
      table: p.orders?.table_sessions?.tables?.table_number ?? null,
      src: p.orders?.order_source || 'staff',
      method: p.method,
      total: amount,
      subtotal: itemsSubtotal > 0 ? itemsSubtotal : subtotalOf(amount, opts),
    };
  });
};
