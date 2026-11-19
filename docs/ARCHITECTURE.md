# Arsitektur Sistem & Alur Data (System Architecture)
## Sistem POS & Self-Ordering Rawon Gusti Surabaya

Dokumen ini menjelaskan rancangan arsitektur perangkat lunak, pola manajemen *state*, mekanisme sinkronisasi data *realtime*, dan mitigasi keamanan sistem monorepo Rawon Gusti Surabaya.

---

## 1. Topologi Arsitektur Monorepo

Sistem mengadopsi pemisahan tanggung jawab (*Separation of Concerns*) berbasis monorepo:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        APLIKASI PENGGUNA (FRONTEND)                    │
│  React 19 + TypeScript + Vite + Tailwind CSS v4                        │
├───────────────────────────────────┬────────────────────────────────────┤
│         CUSTOMER APP              │              POS APP               │
│   (Pemesanan Mandiri QR Meja)     │    (Kasir, Waiter, KDS, Manajer)   │
│   - Katalog Menu 2-Kolom          │    - Grid Meja 3-Kolom             │
│   - Order Stacking                │    - Void Audit Kasir              │
│   - URL Token Masking             │    - Checkout & Cetak Struk        │
└─────────────────┬─────────────────┴──────────────────┬─────────────────┘
                  │                                    │
                  ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       DATA HUB & LOGIKA BISNIS                         │
│  - Supabase PostgreSQL Client (Realtime Subscriptions & RLS)           │
│  - Deterministik Billing Engine (PB1 10%, Service 5%, Kembalian Tunai) │
│  - Resilient Local State Engine (Optimistic Update & Offline Fallback) │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     BASIS DATA (SUPABASE POSTGRESQL)                   │
│  - 10 Tabel Relasional Ternormalisasi (3NF)                            │
│  - Stored Procedures / RPC (Atomic Transaction & Security Definer)     │
│  - Realtime Change Notifications                                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Alur Data Transaksi (End-to-End Data Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Pelanggan as Pelanggan (QR Meja)
    participant CustomerApp as Customer Web App
    participant Supabase as Supabase / State Hub
    participant POS as Kasir POS & KDS Dapur

    Note over Pelanggan,CustomerApp: 1. Pindai QR Meja & Validasi Token
    Pelanggan->>CustomerApp: Pindai QR di Meja (misal: ?token=TABLE_01_DEMO)
    CustomerApp->>CustomerApp: Simpan token ke sessionStorage & samarkan URL ke /pesan
    CustomerApp->>Supabase: Ambil status meja & katalog menu
    Supabase-->>CustomerApp: Daftar menu aktif & Nomor meja terkunci

    Note over Pelanggan,CustomerApp: 2. Pemesanan & Kirim ke Dapur
    Pelanggan->>CustomerApp: Pilih menu, isi catatan porsi, isi Nama Pemesan
    Pelanggan->>CustomerApp: Tekan "Kirim Pesanan ke Dapur"
    CustomerApp->>Supabase: INSERT orders & order_items (Status: Pending)
    Supabase-->>POS: Realtime Broadcast pesanan baru
    POS->>POS: Mainkan Web Audio chime & tampilkan tiket di KDS

    Note over Pelanggan,POS: 3. Pesanan Tambahan (Order Stacking)
    Pelanggan->>CustomerApp: Tekan "Pesan Tambahan" & tambah Es Teh
    CustomerApp->>Supabase: STACK ke sesi meja aktif (Gabung porsi & update total)
    Supabase-->>POS: Update tagihan meja & kirim tiket tambahan ke KDS

    Note over POS: 4. Pelunasan di Kasir (Checkout)
    Pelanggan->>POS: Menuju kasir menyebut nomor meja
    POS->>POS: Buka Checkout, input nominal tunai / scan QRIS
    POS->>Supabase: INSERT payments, tutup table_sessions (Status: Lunas)
    POS->>POS: Cetak struk belanja kasir termal
```

---

## 3. Penanganan Pesanan Tambahan (*Order Stacking Engine*)

Salah satu keunggulan sistem ini adalah kemampuannya menggabungkan pesanan secara mulus:
1. Saat pesanan pertama dikirim, dibuat entri sesi meja aktif (`table_sessions`) dan tiket tagihan utama.
2. Ketika pelanggan menekan tombol **"Pesan Tambahan"**, sistem mendeteksi keberadaan sesi aktif yang belum lunas.
3. Menu baru digabungkan (*merged*) ke dalam daftar menu meja:
   - Jika menu dan catatan sama, kuantiti dijumlahkan.
   - Jika menu atau catatan berbeda, ditambahkan sebagai baris item baru.
4. Nilai finansial dihitung ulang secara otomatis:
   $$\text{Subtotal Baru} = \text{Subtotal Lama} + \text{Subtotal Menu Tambahan}$$
   $$\text{Biaya Layanan} = 5\% \times \text{Subtotal Baru}$$
   $$\text{Pajak Restoran (PB1)} = 10\% \times (\text{Subtotal Baru} + \text{Biaya Layanan})$$
   $$\text{Total Tagihan} = \text{Subtotal Baru} + \text{Biaya Layanan} + \text{PB1}$$
5. Kasir di meja POS langsung melihat tagihan terakumulasi secara utuh tanpa perlu menggabungkan struk terpisah.

---

## 4. Mitigasi Keamanan & Integritas Sistem

### A. Proteksi Anti-Pesan dari Luar (*URL Token Masking*)
- **Masalah**: Pelanggan yang menyalin link QR Code dapat membagikannya ke orang lain di luar restoran untuk melakukan order palsu (*prank ordering*).
- **Solusi**: Begitu halaman `/pesan` dimuat, peramban mengekstrak parameter token, menyimpannya secara eksklusif di memori tab peramban (`sessionStorage`), lalu segera membersihkan bilah alamat URL peramban menggunakan `window.history.replaceState({}, '', '/pesan')`.
- Jika URL tersebut disalin dan dibuka di perangkat atau tab lain, ketiadaan token di memori lokal akan menyebabkan akses otomatis ditolak.

### B. Proteksi Salah Klik Pembatalan Kasir (*Void Order Guard*)
- Tombol pembatalan porsi maupun meja menerapkan warna peringatan tegas **Crimson Wine** (`#ba1a1a`) dan diisolasi dalam jendela konfirmasi modal bertingkat.
- Sistem mewajibkan pencatatan alasan pembatalan untuk memelihara jejak audit kasir (*audit trail*).

### C. Keandalan Berlapis (*Resilient Offline Fallback*)
- Jika koneksi jaringan ke server Supabase mengalami fluktuasi, sistem secara otomatis beralih ke engine *optimistic state* lokal (`rg_mock_sessions_v2`).
- Kasir dan pelanggan tetap dapat melanjutkan transaksi secara mulus tanpa mengalami layar putih (*white screen of death*) atau macet di tengah antrean.
