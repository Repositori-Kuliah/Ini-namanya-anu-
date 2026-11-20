// Fungsi murni dari Fokus_Backend/lib/domain.ts (tanpa efek samping).
// Aturan ini juga ada di SQL (bill_total) - server tetap yang memutuskan angka akhir.
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const rupiah = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID');

/** Layanan 5% dari subtotal, PB1 10% dari (subtotal + layanan). */
export const bill = (subtotal: number) => {
  const service = Math.round(subtotal * 0.05);
  const tax = Math.round((subtotal + service) * 0.1);
  return { subtotal, service, tax, total: subtotal + service + tax };
};
/** Jumlahkan tagihan per pesanan (sama dengan cara server mencatat payments per pesanan). */
export const billOfOrders = (subtotals: number[]) =>
  subtotals.map(bill).reduce(
    (a, b) => ({ subtotal: a.subtotal + b.subtotal, service: a.service + b.service, tax: a.tax + b.tax, total: a.total + b.total }),
    { subtotal: 0, service: 0, tax: 0, total: 0 },
  );
export const changeDue = (received: number, total: number) => Math.max(0, received - total);

export const NEXT: Record<string, string> = { submitted: 'preparing', preparing: 'ready', ready: 'served' };
export const LABEL: Record<string, string> = { submitted: 'Terkirim', preparing: 'Diproses', ready: 'Siap diantar', served: 'Disajikan' };
export const itemsSubtotal = (items: { unit_price: number; quantity: number }[]) => sum(items.map((i) => i.unit_price * i.quantity));

export const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
export const subtotalOf = (total: number) => Math.round(total / 1.155); // balikan dari layanan 5% + PB1 10%
export const toCsv = (rows: any[]) =>
  ['Pesanan,Waktu,Meja,Sumber,Metode,Subtotal,Layanan+PB1,Total',
    ...rows.map((r) => [r.no, r.at, r.table, r.src, r.method, r.subtotal, r.total - r.subtotal, r.total].join(','))].join('\n');
