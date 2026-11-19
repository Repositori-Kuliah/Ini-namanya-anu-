# Panduan Sistem Desain (Design System)
## Sistem POS & Self-Ordering Rawon Gusti Surabaya

Dokumen ini mendefinisikan filosofi desain visual, sistem token warna, hirarki tipografi, dan aturan tata letak (*layout*) untuk menghadirkan pengalaman pengguna yang autentik, elegan, dan fungsional.

---

## 1. Filosofi Desain: Heritage Nusantara

Desain Rawon Gusti Surabaya menggabungkan kehangatan kuliner tradisional Jawa Timur dengan ketegasan antarmuka operasional modern:
- **Tenang & Alami**: Menggunakan warna latar berbasis krem beras dan serat kayu jati, bukan putih steril yang menyilaukan mata kasir yang bekerja berjam-jam.
- **Keterbacaan Seketika (*Glanceability*)**: Angka meja, harga, dan porsi didesain besar dan tegas agar dapat dipindai sekilas dari jarak pandang 50–70 cm di kasir maupun dapur.
- **Kejelasan Status Tanpa Polusi Visual**: Menghindari pemakaian ikon warna-warni yang tidak perlu; warna digunakan sebagai pembawa arti fungsional (*semantic color system*).

---

## 2. Palet Warna (Color Palette & Semantic Tokens)

| Token Desain | Nilai HEX | Peran & Penggunaan dalam Antarmuka |
|---|---|---|
| **Canvas Background** | `#fcf9f4` | Warna dasar seluruh layar aplikasi (lembut dan tidak menyilaukan mata). |
| **Card Surface** | `#ffffff` | Latar kartu meja, panel pesanan, dan kontainer menu. |
| **Border Neutral** | `#ebe8e3` | Garis pembatas kartu, pemisah baris menu, dan input form. |
| **Subtle Divider** | `#f0ede9` | Garis halus antar porsi hidangan dan latar kontrol segmentasi. |
| **Primary Teak Wood** | `#3d1018` | Warna identitas restoran: Tombol primer, judul utama, dan teks nomor meja terisi. |
| **Hover Teak Wood** | `#58252c` | Status *hover* dan *active* tombol primer. |
| **Crimson Wine** | `#ba1a1a` | Aksi destruktif, tombol hapus/batalkan menu (*void*), dan toast peringatan. |
| **Darker Crimson** | `#93000a` | Status *hover* tombol hapus dan teks konfirmasi bahaya. |
| **Deep Forest Moss** | `#1b3b22` | Notifikasi toast transaksi berhasil dan status sukses (teduh & tidak kontras tiba-tiba). |
| **Emerald Active** | `#15803d` | Badge notifikasi *Self-Order* masuk pada kartu meja. |
| **Warm Turmeric Accent**| `#994703` | Label catatan koki dan teks aksen dapur. |
| **Text Primary** | `#1c1c19` | Teks nama hidangan, total angka, dan isi form. |
| **Text Secondary** | `#524344` | Label formulir, sub-kategori, dan judul rincian. |
| **Text Muted** | `#847374` | Nomor meja tersedia, timestamp waktu, dan teks placeholder. |

---

## 3. Sistem Tipografi

Kombinasi tipografi dirancang untuk membedakan fungsi artistik restoran dengan fungsi ketelitian numerik:

### A. Tipografi Serif (*Playfair Display / Georgia / Serif*)
- **Karakter**: Berwibawa, anggun, autentik tradisi Nusantara.
- **Penerapan**:
  - Logo restoran pada sidebar (`font-serif text-2xl`).
  - Nomor meja raksasa pada kartu meja (`font-serif text-3xl sm:text-4xl font-bold`).
  - Angka nominal Total Pembayaran (`font-serif text-2xl font-bold`).
  - Judul modal penting.

### B. Tipografi Sans-Serif (*Inter / System Sans*)
- **Karakter**: Bersih, netral, sangat mudah dibaca pada resolusi layar apa pun.
- **Penerapan**:
  - Teks navigasi sidebar dan breadcrumbs.
  - Nama hidangan dan kuantiti (`font-medium text-xs`).
  - Label form, tombol aksi, dan pesan toast.
  - Catatan instruksi khusus koki.

---

## 4. Sistem Layout & Skalabilitas Layar

### A. Grid Meja 3-Kolom Konsisten (Zoom 80% s/d 100%)
- **Aturan**: Grid kartu meja di halaman **Meja & Pelanggan** dikunci secara eksplisit pada pola:
  ```html
  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
  ```
- **Rasional Ergonomi**: Menjaga kartu tetap berada pada komposisi 3 kolom per baris mencegah kartu meja menjadi gepeng atau tertekan saat kasir mengecilkan peramban ke zoom 80%.
- **Proporsi Kartu**: Tinggi kartu berkisar `min-h-[148px]` dengan padding `p-4`, menempatkan angka nomor meja persis di tengah visual kartu.

### B. Layout 2-Kolom Terpadu (Katalog + Ringkasan Pesanan)
- **Aturan**: Diterapkan pada **POS Pesanan Baru** dan **Customer Self-Order (`/pesan`)**:
  ```html
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
    <!-- Kolom Kiri: Katalog (7 Kolom pada Desktop) -->
    <main class="lg:col-span-7">...</main>
    <!-- Kolom Kanan: Ringkasan & Keranjang (5 Kolom pada Desktop) -->
    <aside class="lg:col-span-5 lg:sticky lg:top-18">...</aside>
  </div>
  ```
- **Keunggulan**: Menjamin panel ringkasan pesanan tetap menempel (*sticky*) di samping katalog saat kasir atau pelanggan menelusuri ratusan menu, sehingga total tagihan selalu terpantau.
- **Mode Ponsel (*Mobile Responsiveness*)**: Pada layar di bawah `1024px`, layout secara anggun beralih menjadi tab toggle:
  ```html
  [ Katalog Menu ]  [ Pesanan (3) ]
  ```

### C. Desain Stepper Kuantiti & Aksi Destruktif
- Tombol kuantiti `[-] [qty] [+]` menggunakan sudut membulat `rounded-lg` dengan kontras tinggi.
- Tombol hapus (*delete*) diberi ruang visual tersendiri di ujung kanan baris menu, menggunakan warna latar solid **Crimson Wine** (`bg-[#ba1a1a] text-white`) agar mudah dibidik oleh jari atau tetikus tanpa risiko menekan kuantiti.
