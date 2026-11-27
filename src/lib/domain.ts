// Fungsi murni dari Fokus_Backend/lib/domain.ts (tanpa efek samping).
// Aturan ini juga ada di SQL (bill_total) - server tetap yang memutuskan angka akhir.
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const rupiah = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID');

/**
 * Tarif/biaya yang dipakai untuk menghitung tagihan.
 * Default = layanan 5% + PB1 10% (sama dengan pengaturan bawaan warung).
 */
export type BillOptions = {
  enableService?: boolean;
  serviceRate?: number;
  enableTax?: boolean;
  taxRate?: number;
  roundingRule?: 'none' | '100' | '500' | '1000';
};

export const serviceRateOf = (o: BillOptions = {}) =>
  (o.enableService ?? true) ? (o.serviceRate ?? 5) / 100 : 0;
export const taxRateOf = (o: BillOptions = {}) =>
  (o.enableTax ?? true) ? (o.taxRate ?? 10) / 100 : 0;

/** Layanan 5% dari subtotal, PB1 10% dari (subtotal + layanan). */
export const bill = (subtotal: number, opts: BillOptions = {}) => {
  const service = Math.round(subtotal * serviceRateOf(opts));
  const tax = Math.round((subtotal + service) * taxRateOf(opts));
  let total = subtotal + service + tax;
  if (opts.roundingRule === '100') total = Math.ceil(total / 100) * 100;
  else if (opts.roundingRule === '500') total = Math.round(total / 500) * 500;
  else if (opts.roundingRule === '1000') total = Math.ceil(total / 1000) * 1000;
  return { subtotal, service, tax, total };
};
/** Jumlahkan tagihan per pesanan (sama dengan cara server mencatat payments per pesanan). */
export const billOfOrders = (subtotals: number[], opts: BillOptions = {}) =>
  subtotals.map((s) => bill(s, opts)).reduce(
    (a, b) => ({ subtotal: a.subtotal + b.subtotal, service: a.service + b.service, tax: a.tax + b.tax, total: a.total + b.total }),
    { subtotal: 0, service: 0, tax: 0, total: 0 },
  );
/**
 * Pecah sisa pembayaran (biaya) menjadi layanan + pajak.
 * Dipakai untuk menyusun ulang struk riwayat: tabel `payments` hanya menyimpan
 * total, jadi sisanya (total - subtotal item) dipecah pakai tarif pajak yang berlaku.
 */
export const splitFees = (total: number, subtotal: number, opts: BillOptions = {}) => {
  const fees = Math.max(0, total - subtotal);
  if (fees === 0) return { service: 0, tax: 0 };
  const tRate = taxRateOf(opts);
  const service = Math.min(fees, Math.max(0, Math.round((fees - subtotal * tRate) / (1 + tRate))));
  return { service, tax: Math.max(0, total - subtotal - service) };
};

export const changeDue = (received: number, total: number) => Math.max(0, received - total);

export const NEXT: Record<string, string> = { submitted: 'preparing', preparing: 'ready', ready: 'served' };
export const LABEL: Record<string, string> = { submitted: 'Terkirim', preparing: 'Diproses', ready: 'Siap diantar', served: 'Disajikan' };
export const itemsSubtotal = (items: { unit_price: number; quantity: number }[]) => sum(items.map((i) => i.unit_price * i.quantity));

export const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
export const subtotalOf = (total: number, opts: BillOptions = {}) =>
  Math.round(total / ((1 + serviceRateOf(opts)) * (1 + taxRateOf(opts)))); // balikan dari layanan + PB1
export const toCsv = (rows: any[]) =>
  ['Pesanan,Waktu,Meja,Sumber,Metode,Subtotal,Layanan+PB1,Total',
    ...rows.map((r) => [r.no, r.at, r.table, r.src, r.method, r.subtotal, r.total - r.subtotal, r.total].join(','))].join('\n');
