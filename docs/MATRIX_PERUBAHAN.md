# Matriks Perubahan & Evaluasi Interaksi User dan Manusia (IUM)
## Sistem POS & Self-Ordering Rawon Gusti Surabaya

Dokumen ini mendokumentasikan transformasi sistem secara mendalam, membandingkan kondisi **Sebelum (*Before*)** dan **Sesudah (*After*)**, serta menyajikan **justifikasi ilmiah berdasarkan kaidah Interaksi User dan Manusia (IUM / Human-Computer Interaction)**.

---

## 1. Matriks Rekapitulasi Perubahan Antarmuka

| No | Komponen Antarmuka | Kondisi Awal (Sebelum) | Kondisi Terkini (Sesudah) | Kaidah & Prinsip IUM (HCI) |
|---|---|---|---|---|
| 1 | **Grid Kartu Meja (Meja & Pelanggan)** | Pernah melebar menjadi 4 kolom (`xl:grid-cols-4`) pada layar desktop tertentu, menyebabkan kartu menjadi pipih dan tidak proporsional saat di-zoom. | Terkunci konsisten **3 kolom per baris** (`grid-cols-2 sm:grid-cols-3 gap-3`). Terbaca seimbang dan lega baik pada zoom normal 100% maupun zoom 80%. | **Hick-Hyman Law & Visual Chunking**: Membatasi opsi pemindaian mata menjadi 3 kelompok horizontal memudahkan atensi visual kasir dalam membedakan meja dalam waktu di bawah 1 detik. |
| 2 | **Tombol Hapus & Pembatalan (Void Order)** | Menggunakan warna latar merah muda pucat transparan (`bg-[#ffdadc]/30 text-[#ba1a1a]`), terlihat seperti tombol disabled atau sekunder. | Menggunakan warna solid tegas **Darker Crimson Wine** (`bg-[#ba1a1a] hover:bg-[#93000a] text-white shadow-xs`). | **Visual Affordance & Error Prevention (Nielsen Heuristic #5)**: Aksi destruktif harus memiliki penegasan visual yang jelas (*strong affordance*) agar operator menyadari konsekuensi dari aksi tersebut. |
| 3 | **Pemilihan Meja pada Self-Order Pelanggan** | Memiliki opsi dropdown atau pemilihan meja manual yang rentan salah pilih oleh pelanggan. | **Terkunci Otomatis (Locked Table)** berdasarkan token QR meja yang dipindai, tanpa dropdown dan tanpa switch tipe layanan yang membingungkan. | **Poka-Yoke (Mistake-Proofing) & User Control**: Menghilangkan kemungkinan pelanggan memesan ke meja tetangga atau salah ketik nomor meja mereka sendiri. |
| 4 | **Pilihan "Bawa Pulang" pada Self-Order Meja** | Memiliki toggle "Santap di Tempat" vs "Bawa Pulang (Kasir)" dengan ikon gembok kecil di halaman QR meja. | **Dihilangkan Sepenuhnya**. Pelanggan yang duduk di meja fisik sudah pasti santap di tempat. Pesanan bawa pulang diarahkan langsung ke kasir. | **Aesthetic & Minimalist Design (Nielsen Heuristic #8)**: Menghapus elemen antarmuka yang tidak relevan dengan konteks pengguna (*noise reduction*). |
| 5 | **Sistem Notifikasi Toast Global** | Notifikasi memiliki ikon tebal dengan warna yang kadang kontras tiba-tiba dan memuat teks penjelasan alasan di dalam kurung: `(Salah input kasir)`. | Disesuaikan dengan **palet warna tema tanpa ikon**: Peringatan/Hapus = **Merah Crimson** (`#ba1a1a`), Sukses = **Hijau Moss Green** (`#1b3b22`), Info = **Coklat Jati** (`#3d1018`). Teks alasan dihapus sehingga hanya menampilkan aksi inti. | **Consistency & Standards (Nielsen Heuristic #4) & Signal-to-Noise Ratio**: Memastikan konsistensi tampilan antara POS dan Customer App, serta menghilangkan teks berlebih (*clutter*) agar informasi tersampaikan instan. |
| 6 | **Tata Letak Menu Self-Order (Mobile & Desktop)** | Layout 1 kolom panjang memanjang ke bawah, keranjang mengambang di bar bawah (*floating bottom bar*). | Layout **2-kolom terpadu (Katalog di kiri, Ringkasan Pesanan di kanan)** seperti POS Pesanan Baru, dengan tab toggle responsif di layar ponsel. | **Recognition over Recall (Nielsen Heuristic #6)**: Pelanggan dapat memantau isi keranjang dan subtotal secara langsung di samping katalog tanpa harus berpindah halaman. |
| 7 | **Halaman Status Pesanan Pelanggan** | Menggunakan layout kartu terpisah dengan kotak catatan informasi panjang dan badge status kasir kuning mencolok. | Mengadopsi struktur **panel rincian POS Checkout**: Header kode tagihan `MEJA_02_181126`, tabel kuantiti menu ringkas (`9× Opor Ayam`), dan kalkulasi biaya terstruktur tanpa tombol cetak ulang struk. | **Mental Model Alignment**: Memberikan model mental yang selaras antara apa yang dilihat oleh pelanggan di meja dengan apa yang ditampilkan pada layar kasir. |
| 8 | **Penanganan Pesanan Tambahan (Order Stacking)** | Pesanan baru dari pelanggan berisiko menimpa (*overwrite*) pesanan yang sedang berjalan. | **Akumulasi Otomatis (Stacking)**: Pesanan baru ditambahkan ke dalam daftar porsi meja yang sama dan total tagihan dikalkulasi ulang secara realtime. | **Integrity of Real-World Workflows**: Mengakomodasi kebiasaan alami pengunjung restoran khas Jawa Timur yang sering menambah es teh atau lauk pauk di tengah makan. |
| 9 | **Input Nama Pemesan & Meja** | Terdapat teks placeholder redundant: `placeholder="Nama pemesan..."` dan label `lock No. Meja (Terkunci)`. | Label disederhanakan menjadi **`No. Meja`** dan placeholder di dalam kolom input dikosongkan karena label di atas sudah jelas. | **Clutter Reduction & Ergonomic Typing**: Mematuhi prinsip desain minimalis di mana label input tidak perlu diduplikasi di dalam placeholder. |
| 10 | **Penyederhanaan Modul Pengaturan Outlet (`PengaturanView`)** | Form jam operasional dengan roller mekanis kaku yang memicu ambiguitas AM/PM vs 24-jam, saklar suara yang tersembunyi, dan teks deskripsi redundan. | **Disederhanakan Total**: Form jam kaku dan saklar suara di pengaturan dihilangkan; digantikan panel kontrol layanan esensial (Pemesanan QR, Pajak PB1, Biaya Layanan, WiFi Tamu) dengan tata letak ringkas tanpa teks berulang. | **Aesthetic & Minimalist Design (Nielsen #8) & Error Prevention (Nielsen #5)**: Mengeliminasi potensi kebingungan format jam di peramban dan memangkas pengaturan yang jarang diubah setiap hari. |
| 11 | **Ergonomi & Kendali Suara KDS Dapur (`KitchenDisplayView`)** | Filter stasiun ikut tergulir saat tiket banyak, kartu pesanan rentan mengalami teks meluap (*overflow*), dan kontrol suara bel tersembunyi di pengaturan. | **Bilah Filter Sticky & Wadah Gulir Mandiri**: Filter stasiun terkunci di bagian atas, kartu pesanan memiliki wadah gulir independen dengan proteksi `break-words`/`break-all`, serta dilengkapi tombol toggle bel audio (*Web Audio chime*) 1-klik (`Aktif` / `Senyap`) langsung di bar KDS. | **Visibility of System Status (Nielsen #1) & Recognition over Recall (Nielsen #6)**: Koki dapat memantau dan mengatur feedback audio seketika tanpa harus meninggalkan tampilan antrean dapur. |
| 12 | **Simetri dan Keseimbangan Tab Kategori Menu** | Tab 'Favorit' memiliki ikon bintang oranye dan padding berbeda, sehingga lebih tinggi dan lebih lebar dibanding tab kategori lainnya. | **Normalisasi Dimensi & Penghapusan Ikon Asimetris**: Seluruh tab kategori menggunakan dimensi seragam (`h-8 px-3 inline-flex items-center justify-center font-medium text-xs rounded-xl`) dengan tinggi dan padding yang 100% konsisten. | **Law of Symmetry & Visual Balance (Gestalt Principles)**: Elemen sejenis dalam satu grup navigasi harus memiliki perlakuan visual dan ukuran yang seimbang agar tidak menciptakan kesan visual berat sebelah. |
| 13 | **Penyelarasan 4 Metrik Utama Dashboard & Laporan** | Dashboard menggunakan kartu metrik berukuran besar yang berbeda struktur dan istilah dengan laporan kasir. | **Penyelarasan Strip 4 Metrik Ringkas**: Dashboard dan Laporan diseragamkan dengan strip 4 metrik 1 baris yang identik: Total Omzet, Pesanan Selesai, Rata-rata per Transaksi, dan Pelanggan. | **Consistency & Standards (Nielsen #4)**: Mengurangi beban kognitif manajer dalam membaca ringkasan performa finansial antar halaman. |
| 14 | **Konsolidasi Arsitektur Monorepo ke Unified Fullstack Next.js** | Terpecah antara `apps/frontend` (Vite) dan `apps/backend` (Next.js) dengan duplikasi dependensi dan port berbeda (`5173` & `3000`). | **Disatukan Menjadi Satu Proyek Next.js 16 (App Router)**: POS Kasir (`/`), Self-Order (`/pesan`), dan API Routes (`/api/*`) berjalan terintegrasi dalam satu proses dev/build. | **Architectural Cohesion & Maintainability**: Memudahkan pengujian, deployment satu langkah, dan meniadakan masalah CORS internal antar origin. |

---

## 2. Analisis Berdasarkan Teori & Kaidah IUM / HCI

### A. Fitts's Law (Hukum Fitts)
> *"Waktu yang dibutuhkan untuk berpindah dan menekan suatu target merupakan fungsi dari jarak ke target dan ukuran target."*

- **Penerapan pada Kasir**: Tombol aksi utama seperti **"Kirim Pesanan ke Dapur"**, **"Buka Checkout"**, dan stepper kuantiti `+` / `-` didesain dengan tinggi minimal `h-10` hingga `h-11` (40px–44px) yang memenuhi standar sentuhan ergonomis manusia (*minimum touch target size*).
- **Pencegahan Salah Tekan**: Tombol pembatalan (*void*) diletakkan di tepi dengan padding terisolasi dan diberi jarak visual dari tombol konfirmasi pembayaran, mencegah kesalahan ketukan tak disengaja oleh kasir yang sedang terburu-buru.

### B. Miller's Law (Kapasitas Memori Kerja Manusia 7 ± 2)
- Struktur tabel pesanan dipecah menjadi kelompok informasi (*chunks*) yang ringkas:
  1. *Header Tagihan* (Nomor meja & waktu).
  2. *Daftar Menu* (Kuantiti, nama hidangan, catatan).
  3. *Ringkasan Finansial* (Subtotal, Biaya Layanan 5%, Pajak PB1 10%, Total).
- Pembagian ini mencegah beban kognitif berlebih (*cognitive overload*) bagi kasir maupun pelanggan saat meninjau tagihan.

### C. Heuristik Usabilitas Nielsen
1. **Visibility of System Status**:
   - Status meja terisi langsung ditandai dengan angka tegas berwarna gelap dan status teks *Terisi*.
   - Saat pesanan mandiri dikirim, muncul animasi *confetti* dan notifikasi toast sukses, disusul transisi ke layar status pesanan aktif.
2. **User Control and Freedom**:
   - Pelanggan dan kasir memiliki kendali penuh untuk menyunting catatan per item hidangan kapan saja sebelum dikirim ke dapur.
3. **Error Prevention**:
   - Nomor meja pada aplikasi pelanggan dikunci permanen berdasarkan QR fisik yang dipindai.
   - Pembatalan meja dan menu di kasir dilindungi oleh jendela konfirmasi bahaya (*danger modal*).
4. **Aesthetic and Minimalist Design**:
   - Menghilangkan ornamen logo berlebih pada notifikasi toast dan popup konfirmasi.
   - Menghapus teks instruksi panjang yang tidak diperlukan sehingga antarmuka tampak profesional, tenang, dan berfokus pada kecepatan transaksi.
