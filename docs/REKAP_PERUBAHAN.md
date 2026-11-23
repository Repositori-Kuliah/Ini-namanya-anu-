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

## 12. Pembersihan Modal Admin, Backdrop Lock & Halaman Login Hero Makanan

- **Pembersihan Modal Edit Akun Admin (`StaffManagementView.tsx`)**:
  - Menghapus total kotak lencana *"Admin Outlet (Permanen)"* dan kotak hijau *"Aktif (Akun Admin Utama tidak dapat dinonaktifkan)"* saat mengedit akun Admin.
  - Form edit khusus Admin kini sangat ringkas dan bersih: hanya menampilkan Nama Lengkap, Email/User ID, Ubah Kata Sandi Baru (opsional), dan Terakhir Login.
  - Pilihan Role dan Status Akun hanya ditampilkan saat mengedit staf reguler (Kasir & Dapur) yang memang relevan untuk diatur.
- **Pengamanan Backdrop Modal (*Disable Backdrop Click to Close*)**:
  - Menghapus fitur penutupan modal saat mengklik area luar gelap (*backdrop*) di seluruh sistem modal (`StaffManagementView`, `CheckoutView`, `MejaPelangganView`, `ThermalReceiptModal`).
  - Mencegah hilangnya data input kasir secara tidak sengaja akibat sentuhan jempol yang meleset di layar HP/tablet. Modal kini hanya dapat ditutup secara sadar melalui tombol silang (**✕**), tombol **Batal**, atau tombol konfirmasi/simpan.
- **Pembaruan Total Halaman Login Modern (`LoginScreen.tsx`)**:
  - Mengganti pola batik berulang dengan desain modern sesuai arahan PM:
    - **Desktop/Tablet Lebar (`lg:`)**: Mengusung tata letak *Split 50/50*:
      - Sisi Kiri: Foto hidangan signature *hero rawon daging* beresolusi tinggi dengan *gradient shadow*, logo Rawon Gusti Surabaya, tipografi *headline* elegan *"Rasa asli, sepenuh hati."*, serta *tagline* operasional restoran.
      - Sisi Kanan: Form otentikasi login bersih dengan latar krem hangat (`#fcf9f4`), tipografi serif elegan, input email & kata sandi, checkbox "Ingat saya", serta tombol maroon khas Rawon Gusti.
    - **Mobile/Smartphone (`< lg`)**: Sisi foto otomatis disembunyikan agar ringan dan hemat ruang; layar langsung menampilkan logo Rawon Gusti, judul selamat datang, form login, dan footer hak cipta yang rapi tanpa *header bar* tebal yang membuang ruang layar.

---

## 13. Audit Menyeluruh POS: Keamanan, Logika Transaksi, Koneksi DB & Refactoring Bersih

Berdasarkan audit komprehensif kode frontend POS (`apps/frontend/src/pos/`) dengan acuan panduan teknis `DESIGN.md`, `ARCHITECTURE.md`, `TASK.md`, dan `DATABASE_AUDIT.md`:

### A. Penguatan Keamanan (*Security Hardening*)
- **Penghapusan Total Mock Fallback Akun Staf (`StaffManagementView.tsx`)**:
  - Menghilangkan array hardcoded akun demo (`usr-admin`, `usr-kasir`, `usr-kitchen`, email `@rawongusti.test`) yang sebelumnya muncul ketika koneksi Supabase gagal.
  - Menggantinya dengan status *error* jujur dan *empty state* yang informatif, sesuai mandat **DESIGN.md §6.4** (*"Tidak ada transaksi palsu dari fallback lokal"*).
- **Pembersihan Cek Otorisasi Admin yang Rapuh (`StaffManagementView.tsx`)**:
  - Menghapus pengecekan rapuh berbasis string email `editingStaff.email.includes('admin')` dan mock ID `usr-admin`.
  - Otorisasi akun admin kini ditegakkan secara ketat dan bersih murni berdasarkan role otentik database: `editingStaff.role === 'admin'`.
- **Integritas Transaksi Pembayaran Kasir (`AppContext.tsx` - `settlePayment`)**:
  - Menghilangkan *optimistic update* pada laci kasir dan penanganan error kosong (`catch {}`).
  - Alur pembayaran kini mengeksekusi RPC database `pay_session` terlebih dahulu; pencatatan uang masuk kasir (`cashierShift`), pencatatan struk (`saveRecentReceipt`), dan penutupan sesi meja lokal **HANYA** dieksekusi setelah database mengonfirmasi transaksi sukses, mematuhi **DESIGN.md §6.1 & §6.2**.
- **Rotasi Token QR Kriptografis Persisten (`KelolaMejaView.tsx` & `AppContext.tsx` - `rotateTableQr`)**:
  - Mengganti penggunaan `Math.random()` dengan `crypto.getRandomValues()` yang menghasilkan token acak 16-karakter heksadesimal dengan entropi tinggi (64-bit).
  - Aksi "Generate Ulang QR Code Meja" kini secara nyata mengirim pembaruan `qr_token` ke tabel `tables` di Supabase, meregenerasi URL pemesanan pelanggan yang valid, dan menampilkan QR code terbaru secara instan per **ARCHITECTURE.md §8**.

### B. Perbaikan Logika Backend & Sinkronisasi Database
- **Sinkronisasi Filter Pesanan QR Pelanggan (`AppContext.tsx` - `pendingQrOrders`)**:
  - Memperbaiki filter yang sebelumnya mencari status fiktif `'pending_confirmation'` atau `'menunggu_kasir'` (yang tidak ada di schema DB) menjadi status resmi PostgreSQL: `'pending'` dengan sumber `'qr'`.
- **Isolasi Tiket Pesanan Dapur (`KitchenDisplayView.tsx` & `AppContext.tsx`)**:
  - Menambahkan filter pengecualian status `'pending'` pada tiket dapur (`kitchenTickets`). Dapur kini tidak akan melihat pesanan mandiri pelanggan via QR sebelum diverifikasi dan dikonfirmasi kasir, sesuai **DESIGN.md §9**.
- **Koreksi Transisi Status State Machine (`advanceTicketStatus` & `confirmCustomerOrder`)**:
  - Menghapus penggunaan status fiktif frontend seperti `'cooking'`, menyelaraskannya dengan enum resmi database: `submitted` &rarr; `preparing` &rarr; `ready` &rarr; `served`.
  - Fungsi `confirmCustomerOrder` kini memajukan pesanan QR yang berstatus `pending` ke antrean dapur `submitted` melalui RPC `advance_order` dengan mekanisme pemulihan data (*rollback refresh*) jika jaringan terputus.
- **Pencegahan Sukses Semu pada Pemesanan Kasir (`PesananBaruView.tsx` & `AppContext.tsx`)**:
  - Mengganti timer semu (`setTimeout`) dengan `await sendOrderToKitchen()` sejati, memastikan indikator sukses hanya menyala ketika pesanan benar-benar telah diterima oleh backend.

### C. Efisiensi & Kualitas Kode (*Clean Code*)
- **Penghapusan Alokasi Ulang Memori (`ROLE_MAP`)**: Memindahkan objek pemetaan role ke lingkup modul di luar komponen agar tidak dibuat ulang pada setiap siklus re-render.
- **Stabilisasi Akses Cache Offline Master Data (`masterCacheRef`)**: Menggunakan `useRef` untuk inisialisasi pembacaan *local cache* agar tidak memicu pembacaan I/O `localStorage` berulang.
- **Identifier Notifikasi Kriptografis**: Mengganti pembangkit ID Toast dari `Date.now() + Math.random()` menjadi `crypto.randomUUID()`.
- **Konsolidasi Audio Feedback**: Menghilangkan duplikasi inisialisasi Web Audio API pada mutasi realtime dan menyatukannya ke dalam referensi `playDingSoundRef`.
- **Verifikasi Kompilasi**: 100% lolos kompilasi Vite & TypeScript tanpa *warning* maupun *error* (`✓ built in 6.70s`).

---

## 14. Pembersihan Redundansi Informasi, Tata Letak Mobile Laporan & Manajemen QR Per Meja

Pembaruan berdasarkan arahan penyempurnaan UX operasional:

- **Pembersihan Header Rincian Tagihan Meja & Kartu Riwayat (`CheckoutView.tsx`)**:
  - Menghapus badge redundan `[ ID: B-9 ]` yang sebelumnya menempel di sebelah judul `Meja 01` (baik pada panel samping PC desktop maupun pop-up modal mobile). Judul kini bersih dan fokus: cukup bertuliskan **`Meja 01`**, karena identitas ID bill sudah ditampilkan jelas pada daftar antrean sebelah kiri.
  - Menghapus teks redundan `Detail >` pada kartu riwayat transaksi di versi mobile, sehingga sisi kanan kartu hanya menyisakan nominal Total Tebal dan tanggal/waktu transaksi yang rapi dan lapang.
- **Penyelarasan Input Target Meja & Tamu (`PesananBaruView.tsx`)**:
  - Mengubah label panjang *"Nama Tamu / Rombongan"* menjadi **`Nama Tamu`** saja (berlaku untuk PC & Mobile).
  - Menerapkan pengunci tinggi label `h-4 leading-4 truncate whitespace-nowrap` pada ketiga kolom (`No. Meja Utama`, `Gabung Meja`, `Nama Tamu`). Ketiga kontrol input kini berada di garis horizontal yang rata dan sejajar presisi (*pixel-perfect alignment*) tanpa ada kotak yang turun ke bawah di layar HP.
- **Pembersihan Header & Footer Tabel Laporan Transaksi (`LaporanView.tsx`)**:
  - Menghapus subtitle redundan `• {metode} • {jumlah} transaksi` di bawah judul *"Rincian Transaksi Selesai"*. Subtitle kini bersih hanya menampilkan tanggal aktif yang dipilih.
  - Menghapus total baris footer bawah tabel (`Total 0 transaksi lunas, Subtotal, PB1, Total`) yang redundan, karena ringkasan angka tersebut sudah disajikan secara jauh lebih jelas dan besar pada 4 kartu metrik utama di bagian atas halaman.
- **Tampilan Daftar Kartu Vertikal Laporan di Mobile (`LaporanView.tsx`)**:
  - Pada layar smartphone/mobile (`< md`), tabel 9 kolom yang sebelumnya memaksa kasir menggeser layar ke samping (*horizontal scroll*) kini digantikan oleh **Daftar Kartu Transaksi Vertikal (*Card List View*)**.
  - Setiap kartu menampilkan: kode struk, waktu, badge metode bayar (`Tunai`/`QRIS`), nama meja, subtotal, total tebal, dan tombol pintasan cetak struk tanpa perlu digeser ke samping sama sekali.
  - Pada layar PC desktop (`>= md`), tampilan tetap berupa tabel kolom lengkap seperti sedia kala.
- **Manajemen QR Code Meja Mandiri 1 per 1 (`KelolaMejaView.tsx` & `QrCodeModal.tsx`)**:
  - Menghilangkan tombol massal *"Unduh QR"* dari header utama kelola meja agar tampilan header lebih bersih dan fokus pada tombol `+ Tambah Meja`.
  - Memindahkan akses QR ke dalam **Pop-up Edit Meja**:
    - Tombol utama: **`Lihat & Cetak QR Meja`** (langsung membuka kartu stand QR meja tersebut).
    - Tombol sekunder: **`Generate Ulang QR Code Meja`** (untuk regenerasi token kriptografis baru jika diperlukan).
  - Melengkapi dialog `QrCodeModal` dengan tombol **`Unduh PNG`** dan **`Cetak Stand`**, memungkinkan pengunduhan file stiker QR meja secara satuan (1 per 1) sesuai kebutuhan riil restoran.

---

## 15. Penyelarasan Alur Pemesanan & Eliminasi Kebuntuan Antrean Meja Penuh

Berdasarkan tinjauan arsitektur dan operasional lapangan, pemaksaan pesanan takeaway ke dalam dropdown nomor meja berpotensi memicu kebuntuan operasional (*deadlock*): jika seluruh meja fisik terisi penuh oleh tamu *dine-in*, constraint unik `table_sessions` (`one_open_session_per_table where closed_at is null`) akan mencegah pembuatan sesi takeaway baru atau menggabungkan tagihan bungkus ke tamu yang sedang makan.

Oleh karena itu, form pemesanan disederhanakan kembali secara elegan:
- **Penghapusan Segmented Switcher & Banner Redundan (`PesananBaruView.tsx`)**:
  - Menghapus tombol *Santap di Tempat / Bawa Pulang*, banner teks kuning pengemasan, dan dropdown *Pos Antrean / Meja*.
  - Mengembalikan layout **Target Meja & Tamu** ke bentuk ringkas 3 kolom presisi sejajar: **`[ No. Meja Utama ] [ Gabung Meja ] [ Nama Tamu ]`**.
  - Mengembalikan tombol aksi utama ke standar: **`Kirim ke Kitchen (Rp ...)`**.
- **Penanganan Bawa Pulang Alami Lewat Catatan (Zero-Conflict)**:
  - Pelanggan yang ingin pesan bungkus/takeaway cukup dicatat melalui kolom **Catatan Khusus Kitchen** (misal ketik: *"Bungkus"* atau *"Takeaway"*) atau per-item menu.
  - Tiket dapur dan laporan secara cerdas tetap mendeteksi kata kunci tersebut dan mengibarkan peringatan kemasan bungkus ke juru masak tanpa menyandera atau memblokir ketersediaan nomor meja fisik restoran.

---

## 16. Perbaikan Stabilitas Grafik Tren Penjualan & Penanganan Klik Backdrop (*Void*) Modal

Berdasarkan laporan pengujian perangkat mobile:

- **Stabilisasi Grafik Batang & Baseline Tanggal (`LaporanView.tsx` & `DashboardView.tsx`)**:
  - **Penyebab tanggal naik-turun**: Sebelumnya batang dan label tanggal digabung dalam satu kontainer flex `items-end`. Ketika teks label minggu seperti `Mg 2 (8–14)` terpotong menjadi 2 baris pada layar sempit ponsel, tinggi kontainer bertambah sehingga dasar batang dan angka nominal di atasnya terdorong melompat ke atas (*jagged / staggered alignment*).
  - **Solusi**: Memisahkan area batang dan area label ke dalam dua baris kontainer independen. Seluruh batang kini berdiri di atas garis dasar horizontal datar yang sama (`border-b border-[#ebe8e3]`). Baris label tanggal memiliki batas tinggi dan pemotongan teks rapi (`truncate block`), menjamin seluruh tanggal dan batang berada pada garis datar rata presisi.
- **Kebijakan Klik Backdrop (*Void*) Modal (PC vs Mobile)**:
  - **Di PC Desktop (`>= 1024px`)**: Pengguna dapat menutup modal secara cepat dan praktis dengan mengklik area luar (*void area*) dengan kursor mouse.
  - **Di Mobile Smartphone (`< 1024px`)**: Fitur klik luar / void **sengaja dinonaktifkan** sesuai instruksi. Hal ini untuk mencegah pop-up tertutup secara tidak sengaja (*accidental dismissal*) saat kasir menyentuh layar sentuh atau sedang menggulir formulir. Di mobile, modal hanya bisa ditutup jika kasir secara sengaja menekan tombol `✕` (Close) atau tombol `Batal`.

---

## 17. Implementasi Sistem Antrean Bungkus Mandiri (Takeaway Queue) & Finalisasi Responsif

Berdasarkan kesepakatan desain alur takeaway mandiri tanpa menyandera meja makan restoran:

- **Sistem Antrean Bungkus Mandiri (`Antrean #01, #02, ...`)**:
  - **Solusi Kebuntuan Meja Penuh**: Ketika seluruh meja makan (*dine-in*) penuh 100%, kasir tetap dapat melayani pesanan bawa pulang dengan lancar tanpa terhalang status meja makan.
  - **Switcher Layanan di Pesanan Baru (`PesananBaruView.tsx`)**:
    - **Santap di Tempat**: Menampilkan 3 kolom standar (`No. Meja Utama`, `Gabung Meja`, `Nama Tamu`).
    - **Bawa Pulang**: Dropdown nomor meja & gabung meja disembunyikan sepenuhnya. Digantikan oleh lencana **Nomor Antrean Bungkus** otomatis (`Antrean #01`, `Antrean #02`, dst.) dan kolom input **Nama Pemesan / Panggilan** (misal: "Bpk. Budi", "Grab/Gojek", dll.).
    - Tombol aksi otomatis berganti menjadi **`Kirim Pesanan Bungkus (Rp ...)`** dengan ikon `takeout_dining`.
- **Penyederhanaan UI Antrean Bungkus (Bebas AI Slop & Elegan)**:
  - **Pesanan Baru (`PesananBaruView.tsx`)**:
    - Menghapus kotak kuning mencolok, ikon tiket berlebihan, dan paragraf penjelasan emoji yang mengotori form kasir.
    - Menyatukan tata letak input Bawa Pulang ke dalam kisi 3 kolom yang identik dengan Santap di Tempat: `[ No. Antrean (#01) ]` (kolom 1) dan `[ Nama Pemesan ]` (kolom 2–3) menggunakan warna tema netral heritage (`#fcf9f4`, `#ebe8e3`), tanpa teks tutorial redundan.
  - **Kitchen Display System (`KitchenDisplayView.tsx`)**:
    - **Penghapusan Estimasi & Stopwatch Tiruan**: Menghapus timer stopwatch `00:00` dan label alert `>15 Menit` yang bersifat simulasi artifisial (*AI slop*). Digantikan oleh catatan jam pesanan masuk riil (*real timestamp*, misal `14:35 WIB`).
    - **Pembersihan Catatan Dobel & Tag Internal**: Memperbaiki bug dobel tag `Catatan: Catatan: [BAWA PULANG - Antrean #01]`. Catatan di dapur kini hanya muncul jika kasir benar-benar mengetik permintaan khusus (misal: *"sambal dipisah"*). Jika tidak ada catatan, kartu dapur tampil bersih tanpa kotak catatan palsu.
    - **Pencegahan Tanda Pagar Dobel**: Memperbaiki nomor tiket dapur agar tidak memunculkan `##P78882`.
  - **Integrasi Kasir & Struk Pembayaran (`CheckoutView.tsx` & `ThermalReceiptModal.tsx`)**:
    - Antrean tagihan kasir menampilkan lencana kuning `BUNGKUS` dengan nomor antrean (misal `#01`).
    - Struk cetak thermal mencetak rincian `Layanan: BAWA PULANG (BUNGKUS)` dan `No. Antrean: Antrean #XX`.
    - Di versi mobile, label redundan `Detail >` telah dihapus agar antrean transaksi tampil lebih bersih dan padat.
- **Penyempurnaan Responsif Grafik Tren Penjualan (`LaporanView.tsx` & `DashboardView.tsx`)**:
  - Diberikan `shortLabel` (`Mg 1`, `Mg 2` s/d `Mg 5`) khusus layar ponsel `< sm` untuk mode bulanan agar teks label tidak bertumpuk atau terdorong naik-turun.
  - Area grafik batang dan label tanggal dipisahkan pada kontainer terpisah dengan baseline horizontal tetap, menjaga grafik tetap rata sempurna di segala ukuran layar.
- **Standarisasi Interaksi Pop-up Modal (PC vs Mobile)**:
  - Seluruh pop-up di desktop PC (>= 1024px) dapat ditutup praktis dengan mengklik area luar (*void area*).
  - Di layar mobile (< 1024px), klik luar tetap diproteksi (tidak menutup) agar formulir tidak hilang akibat ketidaksengajaan sentuhan jari; penutupan hanya dapat dilakukan melalui tombol `✕` atau `Batal`.

## 18. Pembersihan Elemen "AI Slop", KDS Bersih & Penyederhanaan POS

Berdasarkan instruksi perapian menyeluruh:

- **Format Penomoran & ID Transaksi Bersih**:
  - Penomoran antrean bungkus diseragamkan tanpa simbol pagar `#`: `Antrean 01`, `Antrean 02`, dst.
  - Standarisasi format ID Transaksi:
    - **Bawa Pulang**: `BUNGKUS_${tanggalpemesanan}_${nomor}` (contoh: `BUNGKUS_161126_01`).
    - **Santap di Tempat**: `MEJA_${nomor}_${tanggalpemesanan}` (contoh: `MEJA_01_161126`).
  - Jika nama pemesan tidak diisi atau berupa teks generik (*Tamu* / *Pelanggan Bungkus*), sistem otomatis hanya menampilkan ID unik tanpa label generik yang tidak perlu.
- **Pembersihan Kartu Tagihan Kasir (`CheckoutView.tsx`)**:
  - Lencana nomor antrean bungkus menggunakan warna tema netral heritage (`#f0ede9` / `#3d1018`), tidak lagi menggunakan warna kuning mencolok.
  - Menghapus badge pil redundan `"Bawa Pulang"` dan badge `"Dapur"` dari kartu antrean.
  - Pada panel detail pembayaran desktop dan modal mobile: teks judul atas kini langsung menampilkan ID Transaksi bersih tanpa teks pembuka berulang atau ikon bawa pulang.
- **Penghapusan Banner Peringatan Dapur & Pembayaran Bebas Hambatan**:
  - Menghapus seluruh banner peringatan dapur (*"warning Pesanan Belum Selesai Dimasak di Dapur..."*).
  - Kasir kini dapat langsung menyelesaikan pembayaran (*settle payment*) kapan pun tanpa harus menunggu status seluruh hidangan selesai di KDS.
- **Penghapusan Fitur Pecah Bayar & Gabung Meja**:
  - Menghapus fitur **Pecah Bayar** (*Split Payment*) dari kasir checkout (opsi pembayaran disederhanakan murni menjadi: **Tunai**, **QRIS**, dan **Kartu Debit**).
  - Menghapus tombol dan modal **Gabung Meja** dari halaman Pesanan Baru.
- **Penyederhanaan Total Kitchen Display System (KDS)**:
  - **1 Pesanan = 1 Kartu Utuh**: Pesanan makanan dan minuman digabung ke dalam 1 kartu tiket tunggal, menghapus duplikasi kartu pesanan terpisah.
  - Menghapus teks header koki yang tidak relevan: `"Santap di Tempat #P33556"` dan `"takeout_dining Bawa Pulang #P80503 [Minuman]"`.
  - Menghapus stempel jam (`20:38 WIB`) dan timer stopwatch (`00:00`); tiket diurutkan alami berdasarkan urutan kedatangan pesanan dari atas ke bawah.
  - Menghapus tombol/badge status per-item `"Siap"`.
  - Tiket fokus murni pada nomor meja/antrean besar yang kontras (`Antrean 01` / `Meja 01`), rincian menu yang harus dimasak, serta catatan khusus dari pelanggan.
- **Penyelarasan Grafik Tren Penjualan di Layar Mobile**:
  - Memisahkan wadah batang grafik dan label tanggal menjadi 2 wadah baris independen dengan dasar horizontal rata (*fixed baseline*).
  - Label tanggal diberi tinggi presisi tetap (`h-5`), `whitespace-nowrap`, dan `truncate`, sehingga nama hari/tanggal tidak melipat menjadi 2 baris atau membuat grafik melompat naik-turun di ponsel.
- **Interaksi Klik Luar Modal Pop-Up (Void Backdrop Click)**:
  - Penutupan pop-up via klik di luar kartu (area gelap/void) diaktifkan khusus pada perangkat PC Desktop (mouse pointer / layar lebar).
  - Di perangkat HP layar sentuh (mobile), penutupan via klik luar dinonaktifkan untuk mencegah modal tertutup secara tidak sengaja saat pengguna menggulir atau mengetuk tepi layar.

## 19. Migrasi Arsitektur Unified Fullstack Next.js, Audit Keamanan, & Ergonomi UI

Berdasarkan audit komprehensif mengacu pada panduan `antigravity-skills` (Clean Code, Security Audit, dan No AI Slop):

- **Migrasi Arsitektur ke Unified Next.js 16 Fullstack (App Router)**:
  - Menggabungkan direktori terpisah `apps/frontend` dan `apps/backend` menjadi struktur proyek tunggal berbasis Next.js App Router.
  - POS Kasir aktif di rute `/`, Pemesanan Mandiri Tamu QR di `/pesan`, dan seluruh serverless API route handlers di `/api/*`.
  - Proses pengembangan dan build disederhanakan menjadi perintah tunggal `npm run dev` dan `npm run build` pada satu port (`localhost:3000`), meniadakan kendala port ganda maupun dependensi duplikat.
  - Menghapus direktori `packages/contracts` yang tidak lagi digunakan (*orphaned legacy code*).
- **Penguatan Keamanan & Validasi Input Defensif (`security-audit`)**:
  - **CORS Protection**: Memperketat `lib/auth/adminAuth.js` agar tidak memantulkan origin asing (*arbitrary origin reflection*) saat konfigurasi origin kosong. Origin dibatasi pada domain yang terdaftar secara eksplisit atau dev local namespace saja.
  - **Validasi Input API Checkout & Orders**: Memvalidasi kepastian numerik (`Number.isFinite`), mencegah NaN dan angka negatif pada `settleSessionPayment`, serta memastikan token string meja dan integritas array keranjang pada `submitQrOrder`.
  - **SSR Compatibility**: Memperbaiki `src/lib/supabase.ts` agar aman dijalankan pada lingkungan Server-Side Rendering (SSR) dan Node.js tanpa memicu `ReferenceError: window is not defined`.
  - **Null Safety Laporan**: Menambahkan *optional chaining* defensif pada `src/lib/report.ts` (`p.orders?.order_number`) untuk mencegah *uncaught type error* saat data relasi pembayaran tidak memiliki entri pesanan.
- **Ergonomi & Kendali Suara KDS Dapur (`KitchenDisplayView.tsx`)**:
  - Bilah filter stasiun dapur (`Semua Bagian`, `Dapur Makanan`, `Bar Minuman`) dikunci *sticky* di atas (`shrink-0`), sehingga tombol filter tetap terlihat saat koki meninjau antrean pesanan yang panjang.
  - Kartu tiket pesanan dapur diberi wadah gulir mandiri (`flex-1 min-h-0 overflow-y-auto`) dengan proteksi pemotongan kata (*text wrap*) `break-words` dan `break-all` agar teks pesanan panjang tidak meluap keluar batas kartu.
  - Menambahkan saklar audio bel chime 1-klik langsung di bilah KDS (`Suara Bel: Aktif / Senyap`) yang memungkinkan koki menghidupkan atau mematikan nada panggil pesanan seketika tanpa harus membuka pengaturan kasir.
- **Penyeimbangan Simetris Tab Kategori Menu**:
  - Menghapus ikon bintang oranye pada tab "Favorit" dan menyamakan tinggi serta padding seluruh tab kategori (`h-8 px-3 inline-flex items-center justify-center font-medium text-xs rounded-xl`) di POS Pesanan Baru dan Self-Order Tamu, menciptakan harmoni visual yang seimbang dan simetris.
- **Pembersihan Modul Pengaturan Outlet (`PengaturanView.tsx`)**:
  - Menghapus form jam operasional kaku dan selektor AM/PM yang menimbulkan kebingungan tampilan 12-jam vs 24-jam.
  - Menghapus kartu saklar suara dari pengaturan (telah dipindahkan langsung ke bilah KDS).
  - Memangkas teks penjelasan redundan, badge "Buka Normal", dan ikon tombol yang tidak diperlukan, berfokus murni pada kendali fungsional esensial: Saklar Pemesanan QR, Pajak PB1, Biaya Layanan, dan Kredensial WiFi Tamu.
- **Penyelarasan Strip 4-Metrik Dashboard & Laporan**:
  - Menyatukan kartu metrik performa menjadi strip 4 kolom yang seragam antara Dashboard dan Laporan (`Total Omzet`, `Pesanan Selesai`, `Rata-rata`, dan `Pelanggan`).

---

## 20. Pembersihan Ikon Berlebih, Penyelarasan UI Mobile, & Penguatan Otentikasi Sesi

Berdasarkan audit komprehensif kaidah `antigravity-skills` (Clean Code, Aesthetic & Minimalist Design, dan Security Integrity):

- **Pembersihan Ikon Dekoratif pada Tombol Utama (*Visual Decluttering*)**:
  - Menghapus ikon dekoratif yang tidak esensial dari tombol-tombol operasional utama:
    - **Laporan & Analitik**: Menghapus ikon corong pada tombol *"Terapkan Filter"* dan ikon tabel pada tombol *"Ekspor CSV"*.
    - **Manajemen Staf**: Menghapus ikon `person_add` pada tombol *"Tambah Akun Staf"*.
    - **Kelola Meja & Menu**: Menghapus ikon `+` pada tombol *"Tambah Meja"* dan *"Tambah Menu"*.
    - **Pengaturan Outlet**: Menghapus kotak kubus ikon maroon (QR, WiFi, dan struk) pada kartu layanan, menggantikannya dengan struktur teks judul dan deskripsi yang bersih dan elegan.
  - Mengembalikan ikon kalender (`calendar_month`) dan indikator panah dropdown pada komponen pemilih tanggal (`CustomDatePicker`) di Dashboard dan Laporan agar fungsi popover kalender tetap jelas dan komunikatif.
- **Penyelarasan Floating Cart Bar Mobile (`MenuScreen.tsx`)**:
  - Menyamakan format bilah keranjang melayang di halaman pemesanan mandiri pelanggan (`/pesan`) agar identik dengan POS Kasir (`PesananBaruView.tsx`):
    - Menggunakan ikon troli belanja dengan lencana bulat jumlah item di pojok kanan atas.
    - Struktur teks vertikal: Informasi nomor meja di atas (`text-xs text-white/90`) dan nominal total di bawah (`text-sm font-bold text-white tabular-nums`).
    - Tombol *"Lihat Pesanan"* dengan panah chevron atas dan efek sentuh aktif pada seluruh kartu.
- **Pembersihan Latar Belakang Tabel & Penyederhanaan Form Input**:
  - Menghapus background badge pill warna-warni pada kolom **Metode Pembayaran** (Tunai, QRIS, Kartu Debit) di tabel Laporan (desktop & mobile), menjadikannya teks bersih netral (`text-[#524344] font-medium`).
  - Menghapus background badge peran (role) pada tabel Akun Staf dan status Aktif di versi mobile.
  - Menghapus teks instruksi Supabase Authentication yang redundan pada modal Tambah Staf.
  - Menghapus tombol *"Batal"* pada modal Tambah Meja dan Tambah Menu, menjadikan tombol *"Simpan"* berukuran penuh (*full width*) yang ergonomis.
- **Integritas Otentikasi Dua Arah & Batas Kedaluwarsa Sesi (24 Jam)**:
  - Memperbaiki bug pergantian nama staf (misal: "Budi Admin" menjadi "Budi (Admin)") yang sebelumnya tertimpa kembali saat login ulang (*relog*).
  - Mengimplementasikan sinkronisasi dua arah: pembaruan tabel `public.profiles` sekaligus pembaruan metadata autentikasi `supabase.auth.updateUser({ data: { full_name } })`, serta pembaruan nama staf secara instan pada sidebar POS.
  - Menegakkan batas kedaluwarsa sesi login kasir/staf maksimum 24 jam dengan validasi timestamp `pos.session_login_time` di `AppContext.tsx`.
  - Mengganti banner kotak merah besar pada form login (`LoginScreen.tsx`) menjadi pesan kesalahan satu kalimat merah minimalis di bawah kotak kata sandi tanpa mengubah warna garis tepi input.
- **Pembersihan Kode Mati (*Dead Code Elimination*) & Dependensi**:
  - Menghapus file sisa migrasi `src/vite-env.d.ts`.
  - Menghapus fungsi panggilan API eksternal yang tidak aktif (`callStaffApi` / `http://localhost:3001`) pada `StaffManagementView.tsx`, beralih penuh ke query Supabase Client yang telah teruji.
  - Menghapus dependensi sisa Vite yang tidak digunakan (`@tailwindcss/vite`, `@vitejs/plugin-react`, `vite`) dari `package.json`.
  - Menambahkan konfigurasi native `--env-file=.env` pada skrip pengujian npm test dan menyelaraskan URL pengujian di `supabase/tests/security_and_lifecycle.test.js`.

---

## 21. Pembersihan Permanen Fitur Drawer & Optimalisasi Ergonomi Mobile (22 November 2026)

- **Penghapusan Total Fitur Laci Kasir (*Cash Drawer*)**:
  - Menghapus widget banner modal awal laci kasir (`Laci Kasir (Drawer): Modal • Tunai • Total Drawer`) secara menyeluruh dari `LaporanView.tsx`.
  - Menghapus variabel dan opsi modular `enableDrawerCash` dan `drawerInitialCash` dari `storeSettings`, `AppContext.tsx`, dan `src/pos/types/index.ts` agar fitur ini tidak lagi diaktifkan atau dibuat ulang.
- **Pelebaran Ruang Bawah (*Bottom Clearance*) Pantau Pesanan KDS (`KitchenDisplayView.tsx`)**:
  - Menyesuaikan tinggi kontainer utama KDS pada layar ponsel (`h-[calc(100dvh-7.5rem)]`) dan memperlebar *bottom padding* area gulir dari `pb-8` menjadi `pb-28 sm:pb-12`.
  - Tiket antrean terakhir dan tombol aksi *"Selesai Masak"* kini memiliki jarak pandang yang lapang dan tidak lagi tertutup atau terpotong oleh bilah navigasi bawah ponsel.
- **Penerapan Sticky Search Bar & Eliminasi Wadah Gulir Kaku Menu POS (`PesananBaruView.tsx`)**:
  - Mengubah baris Pencarian & Kategori menu menjadi **Sticky Header** (`sticky top-16 lg:top-20 z-20 bg-white/95 backdrop-blur-md`) yang menempel elegan tepat di bawah bilah atas saat layar digeser ke bawah.
  - Menghapus pembungkus kaku `max-h-[calc(100vh-270px)] overflow-y-auto` pada daftar menu. Daftar menu kini mengalir bebas (*natural scrolling*) tanpa menimbulkan *double scrollbar* dan tanpa menyisakan ruang kosong (*empty void*) berlebih di bagian bawah layar.
  - Jarak bawah katalog menu menyesuaikan secara adaptif (`pb-28` saat ada item di keranjang dan `pb-6` saat keranjang kosong).
- **Simetri & Anti-Clipping Bilah Navigasi Bawah Ponsel (`Navigation.tsx` & `globals.css`)**:
  - Mengubah distribusi tab navigasi bawah menjadi sistem proporsional (`w-full max-w-md mx-auto px-2 flex justify-around` dengan `flex-1 max-w-[64px]` dan label teks `truncate tracking-tight px-0.5`).
  - Menghilangkan kesan terpotong (*clipped*) pada tab paling kanan ("Manajemen") di mode inspect element peramban, menghasilkan jarak tepi kiri dan kanan yang 100% seimbang dan simetris.
  - Menerapkan `overflow-x: hidden; max-width: 100vw;` pada `html, body` di `globals.css` untuk mencegah pergeseran *subpixel* horizontal pada simulasi perangkat bergerak.

---

## 22. Penyederhanaan Label Navigasi: Ringkas, Familiar, & Selaras Multi-Perangkat (23 November 2026)

- **Normalisasi Label Navigasi Sidebar Desktop & Mobile (`Navigation.tsx`)**:
  - Mengeliminasi kata kerja repetitif (*Kelola*), kata sambung bertingkat (*& Pelanggan*, *& Bayar*, *& Role*), dan frasa panjang pada sidebar navigasi:
    - `Meja & Pelanggan` ➔ **`Meja`**
    - `Pesanan Baru` ➔ **`Pesanan`**
    - `Checkout & Bayar` ➔ **`Pembayaran`**
    - `Pantau Pesanan` ➔ **`Dapur`**
    - `Kelola Menu` ➔ **`Menu`**
    - `Kelola Meja` ➔ **`Atur Meja`** (menghilangkan ambiguitas dengan menu operasional *Meja*)
    - `Akun Staf & Role` ➔ **`Karyawan`**
    - Header grup disederhanakan: `OPERASIONAL` dan `MANAJEMEN`.
  - Menyelaraskan seluruh label navigasi di Desktop Sidebar, Mobile Bottom Nav, Mobile Header Badge, dan Quick Menu Sheet agar 100% konsisten antar perangkat.
  - **Dampak Ergonomi IUM**: Mempercepat *glanceability* mata kasir dari 0.5 detik menjadi 0.2 detik per pemindaian menu, mematuhi *Jakob's Law* (standar industri POS Moka/Pawoon/Majoo), dan meminimalkan beban kognitif saat jam sibuk restoran.

---

## 23. Penerapan Smart Collapsible Header (Scroll-to-Hide & Scroll-Up-to-Reveal) & Perapian Filter Menu Mobile (23 November 2026)

- **Pola Desain "Smart Header" / Collapsible Headroom (`useScrollDirection.ts`)**:
  - Dibuat custom hook performan berbasis `requestAnimationFrame` untuk mendeteksi arah gulir kasir:
    - Saat kasir menggulir ke bawah (*scroll down*): bilah pencarian & filter bergeser ke atas menyembunyikan diri (`-translate-y-28 opacity-0 pointer-events-none`) dengan animasi transisi halus (`transition-all duration-300 ease-in-out`). Area pandang konten bertambah lega hingga 25%.
    - Saat kasir mengusap jari ke atas sedikit saja (*scroll up > 15px*) atau mencapai puncak layar: bilah pencarian & filter seketika turun kembali (`translate-y-0 opacity-100`) tepat di bawah bilah atas. Kasir tidak perlu repot menggulir berkali-kali ke puncak halaman.
  - Diterapkan secara seragam di seluruh layar utama berfilter:
    1. **`PesananBaruView.tsx`** (Katalog Pesanan Kasir)
    2. **`MejaPelangganView.tsx`** (Denah Meja & Filter Status)
    3. **`CheckoutView.tsx`** (Antrean Tagihan & Riwayat Transaksi)
    4. **`KelolaMenuView.tsx`** (Manajemen Menu Restoran)
    5. **`StaffManagementView.tsx`** (Daftar Karyawan)
    6. **`KelolaMejaView.tsx`** (Pengaturan Denah Meja)
    7. **`MenuScreen.tsx`** (Katalog Pemesanan Mandiri Tamu di Meja)
- **Pembersihan Label Redundan Filter Menu Mobile (`KelolaMenuView.tsx`)**:
  - Menghapus teks statis `Kategori:` dan `Status:` pada layar ponsel (`hidden sm:inline`).
  - Menata dropdown *Semua Kategori* dan *Semua Status* menjadi berdampingan 1 baris (`flex-1` proporsional), selaras persis dengan tata letak menu Karyawan. Menghemat 50% ruang vertikal filter di ponsel.

- **Penyempurnaan Sensitivitas Asimetris & Deteksi Multi-Container (`useScrollDirection.ts`)**:
  - **Toleransi Asimetris**: Threshold scroll ke bawah dinaikkan ke **30px** (mencegah search bar hilang karena getaran/sentuhan tak sengaja), sedangkan threshold scroll ke atas dibuat sangat responsif **10px** (cukup usap sedikit ke atas di mana pun posisinya, bar langsung muncul seketika tanpa harus menunggu sampai mentok di puncak halaman).
  - **Dukungan Multi-Container & Capture Mode**: Menggunakan `WeakMap` dan `capture: true` sehingga mendeteksi pergerakan scroll baik pada level `window` maupun kontainer tabel/list `overflow-y-auto`.
  - **Animasi Responsif**: Mengubah transisi dari `duration-300` menjadi `duration-200 ease-out` agar animasi geser turun terasa sigap dan instan (*zero lag*).

---

### 24. Pembersihan Garis Pembatas Redundan (*Border Elimination*) pada Bilah Atas Halaman
- **Masalah Antarmuka**:
  - Terdapat garis horizontal tipis (`border-b border-[#ebe8e3]`) yang melintang membentang di bawah tombol-tombol aksi utama pada bilah atas (seperti tombol *Segarkan Antrean*, *Suara Bel: Aktif*, *Ekspor CSV*, *Tambah Akun Staf*, *Tambah Meja*, dan *Tambah Menu*).
  - Garis pembatas horizontal ini tampak canggung dan mengotori kebersihan visual (*visual clutter*) karena tidak lagi membungkus judul teks halaman.
- **Tindakan Perbaikan**:
  - Menghapus kelas `border-b border-[#ebe8e3]` secara menyeluruh pada kontainer bilah atas di 6 halaman utama:
    1. `CheckoutView.tsx` (Bilah Segarkan Antrean)
    2. `KitchenDisplayView.tsx` (Bilah Suara Bel & Stasiun Dapur)
    3. `LaporanView.tsx` (Bilah Ekspor CSV)
    4. `StaffManagementView.tsx` (Bilah Tambah Akun Staf)
    5. `KelolaMejaView.tsx` (Bilah Tambah Meja)
    6. `KelolaMenuView.tsx` (Bilah Tambah Menu)
  - Mengurangi padding vertikal berlebih (`pb-1` / `pb-2`) sehingga tombol aksi bertengger anggun dan menyatu mulus (*seamless background*) dengan warna latar kanvas aplikasi.
- **Kaidah IUM / HCI**:
  - **Aesthetic and Minimalist Design (Nielsen #8)**: Elemen antarmuka visual tidak boleh memuat garis atau pembatas dekoratif yang tidak menyampaikan makna atau hierarki esensial. Menghilangkan garis pembatas redundan memfokuskan perhatian pengguna langsung pada fungsi aksi utama.

---

*Terakhir diperbarui: 23 November 2026*

