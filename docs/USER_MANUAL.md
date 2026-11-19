# Panduan Manual Pengguna (User Manual Guide)
## Sistem POS & Self-Ordering Rawon Gusti Surabaya

Dokumen ini merupakan panduan operasional langkah-demi-langkah bagi seluruh aktor yang berinteraksi dengan sistem, mencakup **Pelanggan**, **Kasir**, **Pelayan**, **Koki Dapur (KDS)**, dan **Manajer/Admin Outlet**.

---

## 1. Panduan Pelanggan (Customer Self-Ordering — `/pesan`)

### 1.1 Memulai Pemesanan di Meja
1. Pelanggan memindai stiker atau stand akrilik QR Code yang terletak di atas meja menggunakan kamera ponsel pintar (*smartphone*).
2. Peramban web akan membuka halaman pemesanan. Sistem secara otomatis mengamankan sesi meja dan menyamarkan tautan menjadi `/pesan`.
3. Pada layar tertera **No. Meja** yang terkunci otomatis (sesuai meja tempat pelanggan duduk).

### 1.2 Memilih Menu & Menambah Catatan Masakan
1. Telusuri katalog hidangan menggunakan bar pencarian atau sentuh *pill* kategori (**Semua**, **Menu Nusantara**, **Sambelan**, **Pendamping**, **Minuman**).
2. Tekan tombol **`+`** pada kartu menu yang diinginkan untuk memasukkannya ke dalam ringkasan pesanan.
3. Untuk menambahkan preferensi khusus dapur (seperti *"Kuah dipisah"*, *"Kurangi kecambah"*, atau *"Sambal sedang"*), tekan tombol **`+ Catatan`** di bawah nama menu pada panel rincian pesanan.
4. Tuliskan catatan pada jendela dialog yang muncul, lalu tekan **Simpan Catatan**.

### 1.3 Mengisi Nama Pemesan & Mengirim ke Dapur
1. Tuliskan nama Anda pada kolom **Nama Pemesan** agar pelayan dapat menyapa Anda saat mengantarkan pesanan.
2. (Opsional) Tuliskan instruksi umum pada kolom **Catatan Umum Dapur**.
3. Periksa rincian pesanan dan total harga.
4. Tekan tombol utama **Kirim Pesanan ke Dapur**.
5. Sistem akan menampilkan animasi konfirmasi dan mengarahkan Anda ke layar **Status Pesanan**.

### 1.4 Melakukan Pesanan Tambahan (*Order Stacking*)
1. Jika di tengah santapan Anda ingin menambah hidangan atau minuman, buka kembali layar pemesanan dan tekan tombol **"+ Pesan Tambahan"**.
2. Pilih menu tambahan yang diinginkan dan tekan **Kirim Pesanan ke Dapur**.
3. Pesanan tambahan akan secara otomatis **ditumpuk (*stacked*)** ke dalam tagihan meja Anda tanpa menghilangkan pesanan sebelumnya.

### 1.5 Memanggil Pelayan
1. Tekan tombol **"Panggil Pelayan"** di bagian bawah layar.
2. Pelayan akan menerima panggilan melalui notifikasi audio dan segera menghampiri meja Anda.
3. Tombol memiliki sistem pendingin (*cooldown*) selama 60 detik untuk mencegah panggilan berulang tanpa sengaja.

---

## 2. Panduan Kasir (Cashier POS)

### 2.1 Membuka & Memantau Denah Meja
1. Masuk ke menu **Meja & Pelanggan** pada bilah navigasi kiri.
2. Layar menampilkan kartu-kartu meja dalam grid 3-kolom yang proporsional.
3. Status meja ditandai dengan warna dan teks yang jelas:
   - **Tersedia**: Meja kosong dan siap menerima tamu baru.
   - **Terisi**: Meja memiliki sesi aktif atau pesanan yang sedang berjalan.
   - **Self-Order (Badge Hijau Berkedip)**: Menandakan pelanggan di meja tersebut baru saja mengirimkan pesanan via QR.
4. Pilih kartu meja untuk melihat rincian pesanan aktif di panel sebelah kanan.

### 2.2 Membuka Pesanan Baru untuk Meja
1. Pada meja yang berstatus *Tersedia*, tekan tombol **"+ Buka Pesanan untuk Meja [XX]"**.
2. Anda akan dialihkan ke layar **Pesanan Baru**.
3. Masukkan menu yang dipesan pelanggan, sesuaikan kuantiti, dan tambahkan catatan jika diperlukan.
4. Tekan **"Kirim Pesanan ke Dapur"**.

### 2.3 Pembatalan Porsi & Meja (*Void Order Audit*)
Jika terjadi kesalahan pemesanan atau pembatalan hidangan:
- **Membatalkan Sebagian Porsi Menu**:
  1. Pada panel rincian meja, cari menu yang ingin dibatalkan.
  2. Tekan tombol ikon tempat sampah berwarna **Crimson Wine** (`#ba1a1a`).
  3. Jika porsi lebih dari 1, tentukan jumlah porsi yang akan dibatalkan menggunakan tombol `+` atau `-`.
  4. Tekan tombol merah **"Ya, Hapus Menu"**. Sistem akan memperbarui sisa porsi dan total tagihan secara instan.
- **Membatalkan Seluruh Pesanan Meja (*Void Table*)**:
  1. Tekan tombol **"Batalkan Seluruh Pesanan Meja [XX]"** di bagian bawah panel detail meja.
  2. Kotak dialog konfirmasi bahaya akan muncul.
  3. Tekan **"Batalkan Meja"** untuk mengonfirmasi. Sesi meja akan ditutup dan status meja kembali menjadi *Tersedia*.

### 2.4 Memproses Pembayaran (Checkout & Bayar)
1. Buka menu **Checkout & Bayar** dari bilah navigasi atau tekan **"Buka Checkout"** pada panel meja.
2. Pilih nomor tagihan meja yang akan dilunasi.
3. Pilih metode pembayaran yang digunakan pelanggan:
   - **Tunai**: Masukkan nominal uang yang diterima atau klik pecahan cepat (Rp 50.000, Rp 100.000, Uang Pas). Sistem secara otomatis menghitung nilai uang kembalian.
   - **QRIS**: Tampilkan kode QR dinamis pada layar agar dapat dipindai oleh pelanggan via aplikasi perbankan/e-wallet.
   - **Kartu Debit / EDC**: Masukkan nomor referensi transaksi kartu bank.
4. Tekan tombol **"Selesaikan Pembayaran & Lunas"**.
5. Struk kasir dapat langsung dicetak atau ditampilkan dalam format pratinjau termal.

---

## 3. Panduan Koki Dapur (Kitchen Display System — KDS)

### 3.1 Memantau Pesanan Masuk
1. Buka menu **Pantau Pesanan** pada perangkat tablet atau layar monitor dapur.
2. Setiap kali ada pesanan baru (baik dari kasir maupun dari pemesanan mandiri QR pelanggan), sistem akan membunyikan nada lonceng (*audio chime*) otomatis.
3. Kartu tiket pesanan menampilkan:
   - Nomor tiket dan nomor meja (misal: `#1002 — Meja 03`).
   - Waktu pemesanan dan durasi waktu tunggu.
   - Daftar hidangan beserta kuantiti porsi dan instruksi khusus dapur (catatan yang dicetak tebal/warna khusus).

### 3.2 Menyelesaikan Pesanan
1. Setelah seluruh makanan siap saji, tekan tombol **"Tandai Siap Saji"** pada tiket pesanan.
2. Tiket akan berpindah status menjadi selesai, memberi sinyal kepada pelayan untuk mengantarkan makanan ke meja tujuan.

---

## 4. Panduan Manajer & Admin Outlet

### 4.1 Manajemen Katalog Menu (Kelola Menu)
1. Buka menu **Kelola Menu**.
2. **Menambah Menu Baru**: Tekan tombol **"+ Tambah Menu Baru"**, isi nama hidangan, kategori, harga satuan, status *Signature/Favorit*, serta unggah foto menu.
3. **Mengubah Ketersediaan Menu**: Geser sakelar (*toggle*) status untuk mengubah status menu antara *Tersedia* dan *Habis*. Perubahan ini langsung terdistribusi secara *realtime* ke layar pelanggan dan kasir.
4. **Menghapus Menu**: Tekan tombol hapus dengan konfirmasi aman.

### 4.2 Manajemen Meja & Cetak Akrilik QR (Kelola Meja)
1. Buka menu **Kelola Meja**.
2. **Menambah Meja**: Tentukan nomor meja baru dan kapasitas kursi, lalu simpan.
3. **Unduh & Cetak QR Code Meja**:
   - Pilih meja yang diinginkan dan tekan **"Tampilkan QR Code"**.
   - Sistem akan menampilkan pratinjau desain stand akrilik meja elegan bermotif warisan budaya Nusantara.
   - Tekan **"Cetak Stand Meja"** untuk mencetak langsung ke kertas foto/akrilik ukuran standar meja.
4. **Generate Ulang Kode QR**: Jika stiker meja rusak atau ingin merotasi token demi alasan keamanan, tekan **"Generate Ulang Kode QR"**.

### 4.3 Membaca Laporan Penjualan (Laporan)
1. Buka menu **Laporan**.
2. Layar menyajikan ringkasan kinerja penjualan:
   - **Total Penjualan Lunas**: Nilai bruto omzet penjualan.
   - **Jumlah Transaksi**: Frekuensi transaksi yang berhasil diselesaikan.
   - **Rata-rata per Transaksi**: Nilai rata-rata keranjang belanja (*Average Order Value*).
   - **Komposisi Pembayaran**: Diagram perbandingan proporsi transaksi Tunai vs QRIS vs Kartu.
   - **Tabel Riwayat Transaksi**: Rincian transaksi historis lengkap dengan rincian menu dan waktu cetak.
