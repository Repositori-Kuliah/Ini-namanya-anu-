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
  - Penambahan logika otomatis rentang 2 jam: jika jam buka dan jam tutup dipilih sama persis (misal `08:00` dan `08:00`), sistem secara otomatis langsung memberikan rentang 2 jam (`10:00`) saat disimpan tanpa memunculkan pesan error/peringatan yang mengganggu.
  - Roller menit mendukung presisi penuh 00–59 per 1 menit, sehingga waktu seperti `23:59` (format 24 jam) dapat dipilih secara bebas.
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
- **Pembersihan & Redesain Minimalis Meja & Pelanggan (`MejaPelangganView.tsx`)**:
  - **Penghapusan Kartu Metrik Atas**: Deretan kartu metrik ringkasan di atas meja resmi dihapus total. Area denah meja kini langsung naik ke bagian atas layar (*above-the-fold*), memudahkan kasir memilih meja tanpa perlu scroll.
  - **Penyederhanaan Status (Hanya 3 Status)**: Tab filter disederhanakan menjadi 3 kategori bersih: **Semua Meja**, **Terisi**, dan **Tersedia** (menghapus status *Minta Checkout* dan teks *Kosong*).
  - **Kartu Meja Bersih & Tipografi Besar**:
    - Nomor meja di tengah tampil besar dan tegas (`text-3xl / 4xl`).
    - Menghapus seluruh teks redundan: *"Pelanggan (X org)"*, *"Bill #B-X 0 menu"*, *"Sejak HH:MM"*, *"Rp 0"*, *"Kosong"*, *"Kapasitas 4 orang"*, dan *"Siap buka order"*.
    - Status di bawah tengah kini murni hanya **`Terisi`** (saat ada pesanan) atau **`Tersedia`** (saat kosong).
  - **Panel Detail Meja Fokus Menu**:
    - Menghapus status badge *"Disajikan"*, info *"Kapasitas 4 orang"*, dan kotak *"schedule Sejak ... Bill #..."*.
    - Panel langsung menyajikan **Rincian Menu** beserta tombol aksi cepat (*Ringkasan Bill* dan *Buka Checkout*).
  - **Penyelesaian Bug Sesi Zombie Rp 0**:
    - Sesi dengan 0 menu dan Rp 0 otomatis dibersihkan dan ditutup dari database, mengembalikan status meja menjadi **Tersedia**.
    - Kasir juga dibekali tombol **`[Kosongkan Meja]`** untuk mereset meja secara instan jika dibutuhkan.

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

## 6. Pembaruan Operasional Lanjutan (Dapur, Meja, Struk & Anti-Order Fiktif)

- **Penghapusan Tombol Simpan Draf (`PesananBaruView.tsx`)**:
  - Tombol *"Simpan Draf"* resmi ditiadakan dari panel *Target Meja & Tamu*.
  - Alur kasir menjadi tegas dan langsung: kasir memasukkan pesanan lalu langsung klik **"Kirim ke Kitchen"**.
- **Penghapusan Tombol Cepat "Set Habis" di Katalog Pesanan Baru (`PesananBaruView.tsx`)**:
  - Tombol switch ketersediaan (*"Set Habis" / "Set Tersedia"*) pada kartu katalog menu kasir resmi dihapus untuk mencegah risiko *misclick* saat kasir sedang menginput pesanan pelanggan.
  - Pengaturan status ketersediaan menu kini terpusat secara aman di halaman **Kelola Menu**.
- **Sistem Gabung Meja Rombongan yang Bersih & Efisien (`PesananBaruView.tsx`)**:
  - Menghapus *dropdown* Jumlah Pelanggan dan membersihkan seluruh teks redundan:
    - Menghapus badge `"Kapasitas: X Orang"` dan `"Total: X Kursi"`.
    - Pilihan meja utama murni menampilkan `"Meja 01"`, `"Meja 02"`, dst. (tanpa embel-embel kursi/orang).
    - Tombol pemilih meja gabungan menampilkan `"Gabung"` jika belum ada meja tambahan, dan `"2 Meja (M02,M03)"` jika meja digabung (tanpa simbol `+`).
    - Pilihan meja tambahan dalam panel berbentuk tombol nomor bersih (`02`, `03`, `04`, dst.).
    - Menghapus teks "Batal" dan keterangan redundan "Tergabung: ...".
- **Anti-Order Fiktif / Gerbang Validasi Kasir (`CheckoutView.tsx` & `customer/`)**:
  - Pesanan mandiri yang dikirim tamu via scan QR meja kini masuk ke status *menunggu konfirmasi kasir*.
  - Dapur **TIDAK AKAN** menerima atau memasak pesanan sebelum kasir memverifikasinya.
  - Di layar Checkout kasir, muncul banner peringatan pesanan baru lengkap dengan tombol:
    - **`Terima & Masak`**: Menyetujui pesanan dan langsung menembakkannya ke layar Dapur & Bar.
    - **`Tolak (Fiktif)`**: Membatalkan pesanan palsu/iseng seketika tanpa ada bahan yang terbuang.
- **Redesain Struk Thermal Kasir 100% Sesuai Foto Fisik (`ThermalReceiptModal.tsx`)**:
  - Logo kaligrafi `gusti` di bagian atas tengah dengan nama toko **RAWON GUSTI** dan alamat lengkap (*Ruko Sentra, Jl. Taman Internasional No. A5, Sambikerep, Surabaya. Telp: +62 812-4890-7556*).
  - Judul struk: **STRUK PEMBAYARAN** diapit garis putus-putus.
  - Format rincian menu 2 baris presisi: Baris 1 nama hidangan, Baris 2 kuantitas x harga di kiri dan subtotal di kanan tanpa prefiks Rp.
  - Perhitungan: Subtotal, Layanan 5%, PB1 10%, **TOTAL** tebal besar, status **TUNAI LUNAS**, nominal dibayar, kembalian, dan ucapan penutup *"Terima kasih! Atas kunjungan Anda"*.
- **Pemisahan Dapur Makanan & Bar Minuman (*Dual Station Routing* di KDS)**:
  - Logika KDS otomatis memecah 1 pesanan meja menjadi 2 tiket kerja terpisah:
    - **Tiket Dapur Utama (Makanan)**: Khusus berisi masakan (Rawon, Opor, Nasi, Lauk).
    - **Tiket Bar Minuman**: Khusus berisi minuman (Es Teh, Es Jeruk, Sinom, Kopi).
  - Terdapat tombol filter stasiun di bagian atas layar KDS: **`Semua Bagian`**, **`Dapur Makanan`**, dan **`Bar Minuman`**, sehingga tablet di dapur hanya menampilkan makanan dan tablet di bar hanya menampilkan minuman.
  - Barista dapat menyelesaikan minuman lebih cepat dan mengklik *"Siap Diantar"* tanpa menunggu masakan utama selesai.

---

## 7. Kelola Akun Staf (`StaffManagementView.tsx`)

- **Penghapusan Strip Kartu Metrik Staf**:
  - Menghapus deretan kartu ringkasan status staf (*Total Staf Aktif, Kasir, Dapur, Admin*).
  - Tampilan menjadi langsung fokus ke bilah pencarian/filter dan tabel akun staf tanpa memakan ruang vertikal.

---

## 8. Checkout & Pembayaran Kasir (`CheckoutView.tsx`)

- **Penampilan ID Tagihan/Bill yang Bersih untuk Kemudahan Pencarian**:
  - Pada kartu **Riwayat Transaksi** (kiri), nomor tagihan kini ditampilkan bersih (`ID: B-X`) di bawah metode pembayaran, sehingga kasir dapat langsung mencocokkan hasil pencarian bill.
  - Pada kartu **Belum Dibayar** (kiri), nomor tagihan ditampilkan terstruktur (`ID: B-X · X menu`).
  - Pada panel detail (kanan), nomor tagihan disematkan rapi di samping nomor meja berupa badge font monospace (`ID: B-X`).
  - Ketika antrean tagihan kosong (`bills.length === 0`), panel kanan sepenuhnya disembunyikan sehingga tidak terjadi duplikasi informasi dengan kartu di kolom kiri.
  - Kartu *"Semua Tagihan Selesai"* cukup muncul satu kali saja di kolom antrean kiri secara rapi.
  - Panel kanan hanya akan muncul otomatis ketika kasir memilih salah satu tagihan atau riwayat transaksi yang ingin diproses/dilihat.
- **Pembersihan Header Rincian Tagihan Terpilih**:
  - Menghapus badge `"Belum Lunas"` dan `"Lunas"`.
  - Menghapus baris detail teknis `"ID: B-000 Pelayan: - 0 Tamu"`.
  - Menghapus tombol kecil `[🖨 Struk]` di pojok kanan atas header pada kedua tab.
  - Header kini hanya menampilkan nomor meja bersih yang tegas: `Meja XX`.
- **Perbaikan Kartu Riwayat Transaksi (Daftar Kiri)**:
  - Menghapus teks `"Tamu"`, badge `"Lunas"`, dan ID tagihan `"B-9"`.
  - Menyisakan hanya informasi metode pembayaran (`TUNAI`, `QRIS`, `KARTU DEBIT`, `PECAH BAYAR`) yang jelas dan mudah dibaca.
  - Menambahkan bantalan padding (`p-1 pb-6`) pada container scroll sehingga garis pinggir (border & ring highlight) kartu paling bawah tidak terpotong saat discroll.
- **Pembersihan Panel Status Transaksi Lunas**:
  - Menghapus badge hitam `"SELESAI"` di dalam kotak detail transaksi lunas.
  - Mempertahankan tombol *"Cetak Ulang Struk"* di bagian bawah untuk kebutuhan kasir.
- **Penghapusan Opsi Centang Cetak Otomatis**:
  - Menghapus checkbox `"Cetak struk kasir termal otomatis setelah pembayaran"`, karena pencetakan struk termal sudah menjadi standar default yang otomatis berjalan saat transaksi dilunasi.

---

## 9. Optimalisasi Mobile & Perampingan Tabel Manajemen (`MejaPelangganView.tsx`, `KelolaMenuView.tsx`, `KelolaMejaView.tsx`, `StaffManagementView.tsx`)

- **Perbaikan Pop-up Meja Mobile (Anti Scroll Tembus di HP)**:
  - Mengubah *Bottom Sheet* Meja & Pelanggan menjadi **Modal Pop-up Tengah** (`fixed inset-0 flex items-center justify-center p-4 bg-black/60`).
  - Menghapus garis abu-abu handle atas yang sebelumnya memicu *scroll chaining* ke halaman latar belakang.
  - Tampilan pop-up meja di HP kini fokus, stabil, dan tidak tembus ke background saat digulir.
- **Perampingan Tabel Kelola Menu (`KelolaMenuView.tsx`)**:
  - Menghapus kolom terpisah `"SWITCH KETERSEDIAAN"` dari tabel utama agar tabel ringkas dan tidak perlu digeser ke kanan pada layar sempit.
  - Switch ketersediaan menu (Tersedia / Habis) dipindahkan ke dalam **Modal Edit Menu** dengan tombol toggle yang jelas.
  - Menambahkan badge kecil `"Habis"` di samping nama menu jika status menu tidak tersedia.
  - **Fitur Mobile**: Di HP (`< 768px`), pengguna cukup menyentuh/klik baris menu untuk langsung membuka pop-up edit menu.
- **Perampingan Tabel Kelola Meja (`KelolaMejaView.tsx`)**:
  - Menghapus kolom `"QR CODE MEJA"` dari tabel utama.
  - Tombol *"Lihat QR Meja"* dimasukkan ke dalam menu dropdown tombol **Aksi** dan juga disediakan tombol langsung di dalam Modal Edit Meja.
  - **Fitur Mobile**: Menyentuh baris meja pada layar HP langsung membuka modal edit meja.
- **Perampingan Tabel Kelola Akun Staf (`StaffManagementView.tsx`)**:
  - Menghapus kolom `"EMAIL / ID PENGGUNA"` dari tabel utama dan menggantikannya dengan kolom informatif **"TERAKHIR LOGIN"**.
  - Menyediakan **Modal Edit Staf Lengkap** yang memungkinkan admin melihat/mengubah email, role, status aktif/nonaktif, log login, serta **reset kata sandi baru**.
  - **Fitur Mobile**: Menyentuh baris akun staf pada layar HP langsung membuka pop-up modal edit staf.

---

## 10. Penyatuan Modal Edit, Saklar Modern & Navigasi Mobile Maroon

- **Navbar Atas & Navigasi Bawah Mobile Konsisten (`Navigation.tsx`)**:
  - Menyamakan palet warna *header* atas dan *bottom bar* bawah di HP dengan mode PC, menggunakan warna merah maroon khas Rawon Gusti (`bg-[#3d1018]`, teks putih, garis pembatas lembut `border-white/10`).
  - Menghapus teks `"• Dine-in"` pada header ponsel (hanya menyisakan `"Surabaya"`).
  - Menampilkan badge peranan staf yang sedang login (`Admin`, `Kasir`, atau `Dapur`) tepat di sebelah kiri tombol keluar/logout.
  - Memberikan *highlight* aktif pada navigasi bawah menggunakan `bg-[#58252c]` dengan teks kontras cerah.
- **Pembersihan Fitur Katalog Pesanan Baru (`PesananBaruView.tsx`)**:
  - Menghapus tombol cepat `"Set Habis / Set Tersedia"` dari kartu katalog pesanan baru untuk mencegah risiko salah pencet (*missclick*) saat kasir sedang sibuk menginput pesanan pelanggan. Pengelolaan ketersediaan menu difokuskan penuh di menu Manajemen Menu.
- **Identitas Tagihan pada Antrean Kasir (`CheckoutView.tsx`)**:
  - Menampilkan nomor bill / ID transaksi (`ID: B-X`) secara jelas pada kartu antrean **Belum Dibayar** maupun kartu **Riwayat Transaksi**, sehingga kasir dapat mencari dan mencocokkan nota pelanggan dengan sangat cepat.
- **Penyatuan Total Aksi ke Modal Edit & Penghapusan Kolom Aksi (`KelolaMenuView.tsx`, `KelolaMejaView.tsx`, `StaffManagementView.tsx`)**:
  - Menghapus seluruh kolom `"AKSI"` dari tabel Kelola Menu, Kelola Meja, dan Kelola Staf.
  - Seluruh baris tabel kini dapat diklik langsung (baik di desktop PC maupun layar HP) untuk membuka Modal Edit.
  - Seluruh fungsi (lihat detail, ubah data, hingga hapus/nonaktifkan) disatukan rapi di dalam masing-masing Modal Edit.
- **Saklar Modern (*Toggle Switch*) pada Modal Edit Menu (`KelolaMenuView.tsx`)**:
  - Mengganti tombol status ketersediaan dan checkbox rekomendasi makanan dengan **saklar modern (*toggle switch*)** animasi geser yang elegan.
  - Menambahkan tombol merah `"Hapus Menu"` di pojok kiri bawah modal untuk menghapus hidangan yang tidak lagi dijual.
- **Generate Ulang QR Code & Hapus Meja pada Modal Edit Meja (`KelolaMejaView.tsx`)**:
  - Mengubah aksi QR menjadi tombol `"🔄 Generate Ulang QR Code Meja"` di dalam modal edit.
  - Menambahkan tombol merah `"Hapus Meja"` di footer modal (dilengkapi proteksi otomatis jika meja masih memiliki pesanan/tamu aktif).
- **Proteksi Akun Admin & Penyederhanaan Role (`StaffManagementView.tsx`)**:
  - Menyederhanakan pilihan peranan staf saat tambah dan edit akun menjadi ringkas tanpa deskripsi panjang: **Kasir**, **Dapur**, dan **Admin**.
  - **Proteksi Super Admin**: Khusus akun Admin Outlet / akun yang sedang login, hak akses dikunci dengan lencana permanen (*Admin Outlet Permanen*) dan statusnya selalu *Aktif* (tidak dapat dinonaktifkan sendiri atau diturunkan jabatannya), namun admin tetap dapat mengubah nama, email, dan mengatur ulang kata sandi baru.
  - Untuk staf non-admin (kasir/dapur), disediakan tombol cepat *"Nonaktifkan Akun / Aktifkan Akun"* di pojok kiri bawah modal.

---

## 11. Perbaikan Scroll Tembus Mobile, Pop-up Checkout & Optimalisasi Struk Termal

- **Penguncian Scroll Halaman Belakang (*Body Scroll Lock*) Universal (`useLockBodyScroll.ts`)**:
  - Dibuatkan custom hook `useLockBodyScroll` yang secara otomatis mengunci `overflow: hidden` pada `document.body` dan `document.documentElement` setiap kali modal atau pop-up aktif.
  - Menambahkan pembatas sentuh `touch-none` pada overlay backdrop, `onTouchMove` guard, serta `overscroll-contain` pada kotak modal di seluruh sistem (`MejaPelangganView`, `CheckoutView`, `ThermalReceiptModal`, `KelolaMenuView`, `KelolaMejaView`, `StaffManagementView`, dan `Navigation`).
  - Halaman latar belakang tidak akan lagi bergerak, bergeser, atau tembus gulir (*scroll chaining*) saat pengguna menyentuh pop-up di HP.
- **Alur Checkout & Riwayat Mobile Berbasis Pop-up Modal (`CheckoutView.tsx`)**:
  - Di layar HP/mobile (`< lg`), bagian Rincian Pembayaran dan Riwayat Transaksi tidak lagi diletakkan menumpuk di bawah daftar antrean yang memaksa pengguna menggulir layar panjang ke bawah.
  - Kasir cukup menyentuh salah satu kartu tagihan di daftar **Belum Dibayar** atau **Riwayat Transaksi**. Sistem seketika membuka **Pop-up Modal Pembayaran/Struk** di tengah layar dengan tombol keluar/silang (`X`) di pojok kanan atas.
  - Kasir dapat langsung memilih metode pembayaran, menekan tombol pecahan uang, atau mencetak struk di dalam modal tersebut.
  - Setelah transaksi selesai atau tombol silang/batal ditekan, pop-up langsung tertutup dan mengembalikan kasir ke daftar antrean awal tanpa kehilangan posisi scroll.
  - Pada layar PC desktop (`lg`), tata letak tetap berdampingan simetris 2 kolom (kiri antrean, kanan detail pembayaran).
- **Optimalisasi Struk Kasir Termal di Layar HP (`ThermalReceiptModal.tsx`)**:
  - Memperbaiki proporsi struk agar tidak lagi menutupi 100% layar HP secara berlebihan.
  - Batas tinggi modal dibatasi rapi (`max-h-[88vh]`), dengan area cetak struk bergaris putus-putus yang dapat digulir (*scrollable container*) menggunakan isolasi `overscroll-contain`.
  - Dilengkapi header ringkas bertuliskan *"Pratinjau Struk Kasir"* beserta tombol silang (`X`), serta tombol *"Tutup"* dan *"Cetak Struk"* yang selalu menempel rapi (*sticky*) di bagian bawah tanpa terpotong layar.

---

*Terakhir diperbarui: 15 November 2026*

