# Rawon Gusti Surabaya — Sistem POS & Self-Ordering QR

Sistem Point-of-Sale (POS) terintegrasi, Kitchen Display System (KDS), dan Pemesanan Mandiri berbasis QR Meja untuk restoran autentik **Rawon Gusti Surabaya**. 

Proyek ini dikembangkan untuk memenuhi standar mata kuliah **Interaksi User dan Manusia (IUM)** dengan mengutamakan kenyamanan pengguna, pencegahan kesalahan (*error prevention*), keterbacaan tinggi (*high visual affordance*), dan konsistensi sistem desain warisan budaya Nusantara (*Heritage Nusantara UI*).

---

## 1. Ikhtisar Arsitektur Unified Fullstack

Proyek ini dibangun di atas fondasi **Unified Next.js 16 Fullstack App Router** yang menggabungkan seluruh aplikasi POS, Self-Order Tamu, dan backend API Route Handlers ke dalam satu repositori terpadu:

```text
Ini-namanya-anu-/
├── app/                      # Next.js App Router (Halaman & Serverless API Routes)
│   ├── page.tsx              # Rute Utama POS Kasir & Operasional (/)
│   ├── layout.tsx            # Root Layout & DevTools Inspector
│   ├── pesan/                # Rute Pemesanan Mandiri Tamu QR Meja (/pesan)
│   └── api/                  # API Route Handlers (/api/checkout, /api/orders, dll)
├── src/                      # Modul Antarmuka Pengguna (React 19 + TypeScript + Tailwind v4)
│   ├── customer/             # Aplikasi Self-Order Pelanggan di Meja (Mobile & Desktop Responsive)
│   ├── pos/                  # Aplikasi Operasional Kasir, Waiter, KDS Dapur, & Manajer
│   └── lib/                  # Utilitas domain, adapter Supabase, & kalkulasi tagihan murni
├── lib/                      # Backend Core Services & Functional Domain
│   ├── auth/                 # Admin authentication & CORS guard
│   ├── domain/               # Billing engine & state machine murni
│   ├── fp/                   # Functional programming primitives (Result ok/err)
│   └── services/             # Order, payment, report, & staff services
├── docs/                     # Dokumentasi Teknis, Desain, Arsitektur, & Panduan Pengguna
│   ├── USER_MANUAL.md        # Panduan manual pengoperasian (Kasir, Pelayan, Dapur, Pelanggan, Admin)
│   ├── MATRIX_PERUBAHAN.md   # Matriks perbandingan Sebelum vs Sesudah & justifikasi kaidah IUM
│   ├── DESIGN.md             # Panduan sistem desain, palet warna, tipografi, & density grid
│   ├── ARCHITECTURE.md       # Desain arsitektur, sinkronisasi data, & mitigasi keamanan
│   └── CODE_DOCUMENTATION.md # Dokumentasi kode sumber standar Javadoc/TSDoc
├── supabase/                 # Basis data PostgreSQL, migrasi, dan seed data
│   ├── migrations/           # Skema tabel (3NF), RLS policy, fungsi RPC aman
│   └── seed/                 # Data katalog menu autentik, akun demo, & meja awal
├── package.json              # Unified root scripts & dependencies
└── README.md
```

---

## 2. Fitur-Fitur Utama

### A. Aplikasi Pemesanan Mandiri QR Meja (Customer App — `/pesan`)
1. **Layout Adaptif 2-Kolom (Katalog & Ringkasan Pesanan)**:
   - Kolom kiri: Pencarian menu instan, filter kategori *pill*, kartu menu dengan foto dan harga.
   - Kolom kanan: Ringkasan pesanan dengan **nomor meja terkunci otomatis** dari hasil scan QR, input nama pemesan, dan catatan umum untuk dapur.
2. **Kustomisasi Masakan per Menu**:
   - Pelanggan dapat menambahkan catatan masak spesifik (misal: *"Kuah dipisah"*, *"Jangan pakai kecambah"*, *"Pedas sedang"*).
3. **Penumpukan Pesanan Otomatis (*Order Stacking*)**:
   - Jika pelanggan memesan menu tambahan di tengah makan (*Pesan Tambahan*), pesanan baru otomatis digabungkan (*stacked*) ke dalam tagihan meja yang sama tanpa mereset pesanan sebelumnya.
4. **Proteksi Anti-Pesan dari Luar (*URL Token Masking*)**:
   - Token verifikasi meja disimpan aman di `sessionStorage` lokal tab dan segera dibersihkan dari address bar (`history.replaceState`), mencegah penyalinan link untuk memesan dari luar restoran.
5. **Tombol Panggil Pelayan (*Service Call*)**:
   - Dilengkapi *cooldown timer* 60 detik untuk mencegah spam penekanan tombol.

### B. Aplikasi POS Kasir, Waiter, & KDS (POS App — `/`)
1. **Manajemen Meja 3-Kolom Proporsional**:
   - Grid kartu meja disusun konsisten 3 kolom per baris (`grid-cols-2 sm:grid-cols-3`) agar nyaman dan terbaca tegas pada zoom normal 100% maupun zoom 80%.
   - Indikator status meja jelas: Meja Tersedia vs Meja Terisi, serta badge notifikasi saat ada pesanan QR baru.
2. **Pembatalan Aman & Audit Kasir (*Void Order*)**:
   - Mendukung pembatalan sebagian porsi (*partial cancel*) maupun pembatalan total meja (*void table*).
   - Tombol pembatalan menggunakan warna tegas **Crimson Wine** (`#ba1a1a`) dengan modal konfirmasi bertingkat untuk mencegah insiden salah klik (*human error prevention*).
3. **Checkout Terpadu (Tunai, QRIS, & Kartu Debit)**:
   - Perhitungan otomatis Subtotal, Biaya Layanan 5%, dan Pajak Restoran (PB1) 10%.
   - Input tunai dilengkapi nominal cepat dan kalkulator uang kembalian instan.
   - Cetak struk belanja standar format kasir termal (58mm / 80mm).
4. **Kitchen Display System (KDS)**:
   - Panel antrean pesanan dapur dengan bilah filter stasiun *sticky*, proteksi *text overflow*, wadah gulir independen, dan tombol toggle bel audio (*Web Audio chime*) 1-klik aktif/senyap.
5. **Dashboard & Laporan Selaras (4-Metric Strip)**:
   - Dashboard dan Laporan diselaraskan dengan strip 4 metrik ringkas: Total Omzet, Pesanan Selesai, Rata-rata per Transaksi, dan Pelanggan.
6. **Manajemen Menu, Meja, & Pengaturan**:
   - Tab filter kategori simetris dan proporsional tanpa ikon asimetris, unduh stiker QR meja beresolusi tinggi, serta pengaturan fitur restoran yang ringkas dan bebas polusi visual.

---

## 3. Skema Basis Data Relasional (Supabase PostgreSQL)

Sistem menggunakan 10 tabel ternormalisasi (3NF) tanpa data statis palsu:

| Tabel | Fungsi dan Peran Sistem |
|---|---|
| `tables` | Master data nomor meja, kapasitas, area, dan token QR. |
| `table_sessions` | Sesi aktif pelanggan di meja, waktu buka, dan penutupan transaksi. |
| `categories` | Kategori hidangan (Menu Nusantara, Sambelan, Pendamping, Minuman, dll). |
| `products` | Katalog produk menu, harga dasar, deskripsi, gambar, dan flag favorit. |
| `extras` | Pilihan ekstra topping (kerupuk udang, telur asin, ekstra sambal). |
| `orders` | Header transaksi pesanan (nomor tiket, sumber pesanan POS/QR, total bayar). |
| `order_items` | Rincian porsi makanan, harga satuan, dan catatan dapur per item. |
| `payments` | Rekapitulasi pembayaran kasir (metode tunai/QRIS, jumlah uang, kembalian). |
| `service_requests` | Log pemanggilan pelayan dan permintaan tagihan dari meja. |
| `profiles` | Akun pengguna dan otorisasi hak akses (Role: Kasir, Waiter, Dapur, Admin). |

---

## 4. Panduan Menjalankan Sistem

### Prasyarat
- **Node.js** v18.0.0 atau lebih baru
- **npm** v9.0.0 atau lebih baru

### Langkah Instalasi & Menjalankan Aplikasi
```bash
# 1. Masuk ke direktori root proyek
cd "d:/Documents/MataKuliah/Semester 5/IUM/Proyek/Ini-namanya-anu-"

# 2. Pasang dependensi
npm install

# 3. Jalankan server pengembangan Fullstack Next.js
npm run dev
```

Aplikasi langsung aktif pada satu port tunggal:
- **POS Kasir & Operasional**: `http://localhost:3000/`
- **Customer Self-Order (Simulasi Meja 01)**: `http://localhost:3000/pesan?token=TABLE_01_DEMO`
- **Backend API Routes**: `http://localhost:3000/api/tables`, `/api/orders`, `/api/checkout/pay`, dll.

### Verifikasi Build Produksi
```bash
npm run build
```

### Menjalankan Pengujian Keamanan & Integrasi
```bash
npm test
```

---

## 5. Kredensial Akun Demo Bawaan

| Peran (Role) | Email | Kata Sandi | Halaman Utama |
|---|---|---|---|
| **Kasir & Pelayan** | `kasir@rawongusti.test` | `password123` | Meja & Pelanggan, Pesanan Baru, Checkout |
| **Koki Dapur (KDS)** | `dapur@rawongusti.test` | `password123` | Pantau Pesanan (KDS) |
| **Manajer / Admin** | `admin@rawongusti.test` | `password123` | Dashboard, Kelola Menu, Kelola Meja, Laporan |

---

## 6. Indeks Dokumentasi Teknis

Untuk rincian desain, evaluasi interaksi manusia-komputer, dan arsitektur kode lengkap, silakan merujuk ke dokumen di folder `docs/`:
1. [Panduan Pengguna (User Manual)](docs/USER_MANUAL.md) — Prosedur operasional langkah-demi-langkah tiap peran.
2. [Matriks Perubahan Desain](docs/MATRIX_PERUBAHAN.md) — Komparasi desain sebelum vs sesudah dan justifikasi kaidah IUM/HCI.
3. [Rekapitulasi Pembaruan Sistem](docs/REKAP_PERUBAHAN.md) — Log kronologis seluruh pembaruan, perbaikan bug, dan optimasi UX.
4. [Panduan Desain & Antarmuka](docs/DESIGN.md) — Filosofi warna Nusantara, tipografi, dan sistem layout.
5. [Arsitektur Sistem & Alur Data](docs/ARCHITECTURE.md) — Diagram relasi data, mitigasi celah keamanan, dan sinkronisasi realtime.
6. [Dokumentasi Kode Sumber (TSDoc)](docs/CODE_DOCUMENTATION.md) — Kamus tipe data dan spesifikasi fungsi inti.
