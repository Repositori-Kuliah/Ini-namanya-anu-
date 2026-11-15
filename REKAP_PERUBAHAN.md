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

- **Jam Buka & Operasional Harian**:
  - Menghapus badge jam di pojok kanan atas kartu jam buka dan jam tutup.
  - Menghapus tombol saran jam / *quick pick presets* (`[07:00] [08:00]...` dan `[20:00] [21:00]...`), sehingga tampilan *roller drum* waktu menjadi sangat ringkas, bersih, dan fokus.
- **Penyelarasan Suara & Audio Notifikasi**:
  - Merapikan kartu Suara & Notifikasi agar rata atas (*flush alignment*) sejajar dengan kartu jam operasional, menghilangkan rongga/gap kosong yang sebelumnya terbentuk karena regangan tinggi kolom (*stretch*).
- **Penyederhanaan Modul Pajak & Biaya Layanan**:
  - Menghapus **Aturan Pembulatan (Round Up)** dan menghapus kotak **Simulasi Kasir (Pesanan Rp 50.000)**.
  - Menghapus tombol *preset* cepat pada Pajak Restoran dan Biaya Layanan.
  - Menata Pajak Restoran dan Biaya Layanan berdampingan dalam *grid* 2 kolom yang simetris dan rapi.
- **Perbaikan Responsif Mobile pada Saklar & Deskripsi**:
  - Memperbaiki tombol saklar (toggle switch) dengan menambahkan `shrink-0` sehingga lingkaran tombol *on/off* tidak lagi terdorong keluar / *overflow* di layar HP/tablet.
  - Menambahkan `shrink-0` pada kontainer ikon/logo agar tidak terhimpit pada layar kecil.
  - Meringkas teks deskripsi pada Pajak (*"Dikenakan pada kasir & pesanan QR meja"*) dan Biaya Layanan (*"Biaya operasional & kebersihan resto"*).
- **Pembersihan & Penataan Kendali Saklar Modul Fitur Restoran**:
  - Menghapus modul **Pelacakan Bahan Baku** dan modul **Modal Awal Kasir di Laci (Cash Drawer)**.
  - Menata modul yang tersisa menjadi tata letak yang proporsional:
    - Baris atas (2 kolom): **Pemesanan Mandiri Tamu (Self-Ordering QR)** & **Pantau Pesanan Dapur (KDS)**.
    - Baris bawah: **WiFi Tamu Restoran (QR & Meja)** dengan pengaturan SSID & Kata Sandi.

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

