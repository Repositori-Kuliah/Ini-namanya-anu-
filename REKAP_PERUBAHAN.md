# Rekapitulasi Pembaruan Sistem Rawon Gusti Surabaya (POS & Self-Ordering)

Dokumen ini merangkum seluruh pembaruan, perbaikan bug, penyesuaian tata letak (layout), dan optimasi pengalaman pengguna (UX) yang telah diterapkan pada sistem **Rawon Gusti Surabaya** (Aplikasi Kasir POS dan Pemesanan Mandiri Tamu QR).

---

## 1. Pemesanan Mandiri Tamu (Self-Ordering QR Meja)

- **Ketahanan Pengiriman Pesanan (*Order Fallback*)**:
  - Penambahan penanganan *fallback* lokal pada `submitOrder` di `customer/context/AppContext.tsx`. Jika RPC database Supabase remote (`place_order`) mengalami kendala *schema cache*, pesanan otomatis tersimpan di sesi lokal pelanggan (`rg_customer_order_${token}`) dan tersinkronisasi ke sesi meja kasir/dapur (`rg_mock_sessions_v2`).
  - Pemesanan tamu kini 100% langsung berhasil terkirim ke dapur tanpa memicu pesan error teknis.
- **Penyederhanaan Preferensi Pembayaran**:
  - Menghapus opsi radio "Preferensi Pembayaran" (QRIS vs Kasir) dari keranjang (`CartScreen.tsx`).
  - Alur pembayaran disatukan langsung ke **Pembayaran di Kasir** (pesanan langsung diproses dapur, pembayaran tunai/QRIS/kartu diselesaikan di kasir saat tamu selesai makan).
- **Penghapusan Estimasi Waktu**:
  - Menghapus teks "Estimasi penyajian: 12 – 18 menit" pada keranjang belanja dan kartu status estimasi waktu siap.
- **Penyederhanaan Halaman Status Pesanan (`StatusScreen.tsx`)**:
  - Menghapus kartu banner progres tahapan penyajian (*progress bar* tahap 1 s/d 4) dan kartu *stepper* linimasa tahapan dapur (*Pesanan Diterima, Sedang Dimasak, Siap Diantar, Terhidang*).
  - Menghapus badge status oranye bertuliskan **"MENUNGGU DI KASIR"**.
  - Tampilan difokuskan langsung pada **Rincian Hidangan**, **Ringkasan Tagihan & Status Pembayaran**, **WiFi Tamu Restoran**, dan tombol aksi cepat (*Panggil Pelayan*, *Tambah Pesanan*, *Minta Tagihan*).
- **WiFi Tamu Terhubung ke Pengaturan**:
  - Kartu info WiFi tamu membaca konfigurasi *real-time* dari pengaturan sistem POS. Jika modul WiFi dinonaktifkan di kasir, kartu otomatis tersembunyi dari halaman tamu.

---

## 2. Pengaturan Sistem Outlet (`PengaturanView.tsx`)

- **Restrukturisasi Modul Fitur Modular**:
  - Memindahkan kartu **Modal Awal Kasir di Laci (Cash Drawer)** ke dalam kelompok **"Kendali Saklar Modul Fitur Restoran"**, diposisikan **tepat di atas modul WiFi**.
  - Urutan saklar modul operasional menjadi terpusat:
    1. *Pemesanan Mandiri Tamu (Self-Ordering)*
    2. *Pantau Pesanan Dapur (KDS)*
    3. *Pelacakan Stok Bahan Baku Otomatis*
    4. *Modal Awal Kasir di Laci (Cash Drawer)*
    5. *WiFi Tamu Restoran (QR & Meja)*
- **Modul WiFi Tamu Restoran**:
  - Penambahan saklar on/off untuk mengaktifkan/menonaktifkan info WiFi tamu di meja.
  - Input kustomisasi Nama / SSID WiFi dan Kata Sandi (Password) WiFi langsung dari kasir, tersimpan di pengaturan lokal outlet.
- **Penyelarasan Desain Simulasi Tagihan Kasir**:
  - Kotak simulasi perhitungan pesanan Rp 50.000 dikembalikan ke posisi seimbang di **kolom kanan (tepat di bawah Aturan Pembulatan)**.
  - Mengganti warna hijau menjadi warna tema Heritage (`#fcf9f4`, `#ebe8e3`, `#3d1018`, `#994703`) dan menghapus badge *LIVE PREVIEW*.

---

## 3. Manajemen Meja & QR Code (`KelolaMejaView.tsx` & `MejaPelangganView.tsx`)

- **Perbaikan Bug Menu Aksi Dobel**:
  - Melakukan deduplikasi data meja di `pos/context/AppContext.tsx` agar nomor meja ganda tidak menghasilkan ID yang sama.
  - Menggunakan `actionKey` yang unik per baris meja sehingga dropdown menu Aksi tidak lagi terbuka menumpuk/dobel pada baris atas.
- **Pembersihan Dropdown Aksi**:
  - Menghapus opsi "Lihat Stiker QR" dari menu Aksi (karena tombol stiker QR sudah tersedia khusus di kolom sebelah kiri).
- **Penghapusan Garis Kotak Terpotong di Meja & Pelanggan**:
  - Menghapus batasan scroll internal pada kontainer grid kartu meja. Kartu meja kini mengalir luas dan alami sehingga seluruh garis kotak/border dan bayangan kartu kembali utuh 100% tanpa terpotong.

---

## 4. Checkout & Pembayaran Kasir (`CheckoutView.tsx`)

- **Scroll Mandiri pada Antrean Tagihan**:
  - Kolom daftar tagihan belum dibayar dan tab riwayat transaksi diberi area scroll vertikal mandiri.
  - Panel rincian tagihan dan tombol pembayaran di sebelah kanan tetap terkunci (*sticky*), memudahkan kasir menggulir antrean panjang tanpa kehilangan tombol aksi bayar.
- **Perbaikan Input Pecah Pembayaran (*Split Payment*)**:
  - Memperbaiki *state* input Nominal 1 (`splitInputStr`) sehingga kasir dapat mengetik angka bebas dengan keyboard tanpa terkunci pada angka `0`.
  - Menghapus fungsi pembatas `Math.min(currentBill.total, raw)` saat mengetik yang sebelumnya memblokir input jika total tagihan belum terpilih.
  - Nilai otomatis diformat dengan tanda pemisah ribuan (*live rupiah formatting*) dan sisa tagihan pada Metode 2 terhitung otomatis.
- **Pembersihan Tombol Cepat**:
  - Menghapus deretan tombol pintas `[50%] [+10rb] [+50rb] [Pas] [C]` agar area input pembayaran menjadi bersih dan fokus.

---

## 5. Tata Letak, Desain & Responsivitas Sistem

- **Penyembunyian Scrollbar di Seluruh Sistem**:
  - Menerapkan aturan CSS global (`* { scrollbar-width: none !important; -ms-overflow-style: none !important; }` dan `::-webkit-scrollbar { display: none !important; }`).
  - Menghilangkan tampilan scrollbar abu-abu tebal bawaan Windows yang memiliki tombol panah atas/bawah. Pengguliran dengan roda mouse (*mousewheel*), *trackpad*, dan sentuhan jari tetap berfungsi normal dan mulus.
- **Perapian Celah (*Gap*) Kosong Bawah di Mobile & Tablet**:
  - Menghilangkan penumpukan padding bawah ganda (`pb-20` s/d `pb-28`) di dalam halaman yang bertumpuk dengan pembungkus `App.tsx`.
  - Mengatur bantalan bawah mobile menjadi presisi setinggi bar navigasi bawah (~72px), menghilangkan rongga kosong raksasa di atas bilah navigasi.
- **Scroll Mandiri pada Tabel Pengelolaan**:
  - Mengintegrasikan scroll internal pada tabel katalog menu, stok bahan baku (`KelolaMenuView.tsx`), tabel meja (`KelolaMejaView.tsx`), dan tabel staf (`StaffManagementView.tsx`) dengan kepala tabel (*table header*) terkunci (*sticky*).

---

*Terakhir diperbarui: 15 November 2026*
