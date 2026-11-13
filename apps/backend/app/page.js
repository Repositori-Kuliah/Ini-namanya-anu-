export default function HomePage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Rawon Gusti — Next.js FP Backend</h1>
      <p>Backend API berjalan menggunakan paradigma Functional Programming murni (JavaScript).</p>
      <ul>
        <li><code>POST /api/orders</code> — Submit pesanan via QR</li>
        <li><code>PATCH /api/orders/[id]</code> — Memajukan status pesanan dapur</li>
        <li><code>POST /api/checkout/pay</code> — Pelunasan sesi pembayaran meja</li>
        <li><code>GET /api/reports</code> — Rekap analitik penjualan</li>
        <li><code>GET /api/menu</code> — Katalog produk menu & kategori</li>
        <li><code>GET /api/tables</code> — Daftar meja restoran</li>
      </ul>
    </main>
  );
}
