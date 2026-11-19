# Dokumentasi Kode Sumber (Code Documentation — TSDoc / Javadoc)
## Sistem POS & Self-Ordering Rawon Gusti Surabaya

Dokumen ini menyediakan spesifikasi teknis kamus tipe data (*TypeScript Interfaces*) dan katalog fungsi utama (*State Management API*) yang digunakan di seluruh aplikasi frontend, disusun dengan standar dokumentasi **TSDoc / Javadoc**.

---

## 1. Kamus Tipe Data Inti (*Core Interfaces*)

### 1.1 `MenuItem`
Mewakili entitas produk makanan atau minuman yang terdaftar di katalog menu.

```typescript
/**
 * Kontrak data produk hidangan Rawon Gusti.
 */
export interface MenuItem {
  /** ID unik lokal (string) */
  id: string;
  /** ID produk pada tabel products basis data Supabase (integer) */
  dbId?: number;
  /** Kode unik SKU (misal: "MN001", "TEH001") */
  code?: string;
  /** Nama hidangan (misal: "Nasi Rawon Daging", "Kombucha") */
  name: string;
  /** Harga satuan porsi dalam Rupiah */
  price: number;
  /** Deskripsi bahan, racikan, atau cita rasa hidangan */
  description?: string;
  /** Nama kategori utama (misal: "Menu Nusantara", "Minuman") */
  category: string;
  /** Status ketersediaan menu (true = siap saji, false = habis) */
  isAvailable?: boolean;
  /** URL foto hidangan beresolusi tinggi */
  image?: string;
  /** Badge penanda promosi khusus */
  badge?: {
    text: string;
    type: 'best_seller' | 'favorite' | 'promo';
  };
}
```

---

### 1.2 `TableItem`
Mewakili status dan isi sesi meja operasional pada sistem POS kasir.

```typescript
/**
 * Kontrak data status dan operasional meja makan.
 */
export interface TableItem {
  /** ID unik meja pada basis data */
  id: string;
  dbId?: number;
  /** Nomor fisik meja yang ditampilkan ke kasir dan pelanggan (misal: "01", "02") */
  number: string;
  /** Kapasitas kursi duduk pelanggan */
  capacity: number;
  /** Status operasional meja */
  status: 'kosong' | 'terisi' | 'billing' | 'reservasi';
  /** Nama pelanggan yang menempati meja */
  customerName?: string;
  /** ID sesi kunjungan aktif meja */
  sessionId?: number;
  /** Waktu pembukaan sesi meja */
  openedAt?: string;
  /** Total tagihan terakumulasi saat ini */
  totalFormatted?: string;
  /** Rincian menu hidangan yang sedang dipesan meja ini */
  items?: OrderItemSummary[];
}
```

---

### 1.3 `ActiveOrder`
Mewakili status dan rincian pesanan aktif pada sisi pelanggan (*Customer Self-Ordering*).

```typescript
/**
 * Kontrak data pesanan aktif pelanggan di meja.
 */
export interface ActiveOrder {
  /** Nomor tiket pesanan dapur (misal: "#1023") */
  ticketNumber: string;
  /** Kumpulan nomor tiket jika terjadi pemesanan tambahan (stacking) */
  orderNumbers: string[];
  /** Nomor meja tempat pelanggan memesan */
  tableNumber: string;
  /** Waktu pengiriman pesanan (WIB) */
  orderTime: string;
  /** Timestamp pesanan dalam milidetik */
  orderTimestamp: number;
  /** Daftar menu yang dipesan */
  items: CartItem[];
  /** Status pembayaran tagihan */
  paymentStatus: 'MENUNGGU DI KASIR' | 'LUNAS';
  /** Subtotal murni seluruh hidangan */
  subtotal: number;
  /** Nilai Biaya Layanan 5% */
  serviceFee: number;
  /** Nilai Pajak Restoran (PB1) 10% */
  tax: number;
  /** Total akhir tagihan yang harus dibayar */
  total: number;
}
```

---

## 2. Dokumentasi Fungsi Inti POS (`src/pos/context/AppContext.tsx`)

### 2.1 `voidOrderItem`
Membatalkan sejumlah atau seluruh porsi menu yang telah dipesan pada sesi meja tertentu dengan pencatatan jejak audit.

```typescript
/**
 * Membatalkan porsi pesanan tertentu dari meja kasir (Void Item).
 *
 * @param tableNumberOrSessionId - Nomor meja (string) atau ID sesi meja (number).
 * @param item - Objek ringkasan item hidangan yang akan dibatalkan.
 * @param reason - Alasan pembatalan (default: "Salah input kasir").
 * @param qtyToVoid - Jumlah porsi yang dibatalkan. Jika tidak diisi, membatalkan seluruh porsi item tersebut.
 * @returns Promise<void>
 *
 * @example
 * // Membatalkan 2 porsi Nasi Rawon dari Meja 02
 * await voidOrderItem("02", targetItem, "Pelanggan membatalkan pesanan", 2);
 */
const voidOrderItem = async (
  tableNumberOrSessionId: string | number,
  item: OrderItemSummary,
  reason: string = 'Salah input kasir',
  qtyToVoid?: number
): Promise<void>;
```

---

### 2.2 `voidTableOrder`
Membatalkan seluruh pesanan pada satu meja sekaligus dan mengembalikan status meja menjadi *Tersedia*.

```typescript
/**
 * Membatalkan seluruh pesanan meja dan menutup sesi secara instan (Void Table).
 *
 * @param tableNumberOrSessionId - Nomor meja (string) atau ID sesi meja (number).
 * @param reason - Keterangan pembatalan (default: "Dibatalkan oleh kasir").
 * @returns Promise<void>
 *
 * @example
 * await voidTableOrder("01", "Pelanggan batal makan karena terburu-buru");
 */
const voidTableOrder = async (
  tableNumberOrSessionId: string | number,
  reason: string = 'Dibatalkan oleh kasir'
): Promise<void>;
```

---

### 2.3 `showToast`
Menampilkan notifikasi umpan balik instan di bagian atas tengah layar dengan palet warna terstandarisasi.

```typescript
/**
 * Menampilkan notifikasi toast global di layar POS.
 *
 * @param message - Teks pesan singkat yang akan ditampilkan.
 * @param type - Kategori notifikasi ('info' | 'warning' | 'success').
 *               - 'info': Latar Coklat Jati (#3d1018)
 *               - 'warning': Latar Merah Crimson Wine (#ba1a1a)
 *               - 'success': Latar Hijau Deep Forest (#1b3b22)
 *
 * @example
 * showToast("Menu baru berhasil ditambahkan", "success");
 * showToast("Pesanan Meja 02 berhasil dibatalkan", "warning");
 */
const showToast = (
  message: string,
  type: 'info' | 'warning' | 'success' = 'info'
): void;
```

---

## 3. Dokumentasi Fungsi Inti Self-Order Pelanggan (`src/customer/context/AppContext.tsx`)

### 3.1 `submitOrder`
Mengirimkan pesanan pelanggan ke antrean dapur Supabase dengan dukungan penumpukan pesanan otomatis (*Order Stacking*).

```typescript
/**
 * Mengirimkan keranjang pesanan pelanggan ke sistem dapur dan kasir.
 * Jika sesi meja sudah memiliki pesanan berjalan, fungsi ini secara otomatis
 * menumpuk (stack) menu baru ke dalam tagihan meja yang sama.
 *
 * @param paymentMethod - Preferensi cara bayar (default: 'cashier').
 * @param notes - Catatan instruksi umum untuk dapur.
 * @returns Promise<boolean> - true jika pesanan berhasil terkirim, false jika gagal.
 *
 * @example
 * const success = await submitOrder('cashier', 'Mohon sajikan kuah panas');
 * if (success) {
 *   navigate('status');
 * }
 */
const submitOrder = async (
  paymentMethod: 'cashier' | 'qris' = 'cashier',
  notes?: string
): Promise<boolean>;
```

---

### 3.2 `updateCartItemQty`
Menambah atau mengurangi jumlah porsi hidangan di dalam keranjang belanja pelanggan.

```typescript
/**
 * Mengubah jumlah porsi suatu item di keranjang belanja.
 * Jika porsi bernilai 0 setelah dikurangi, item otomatis terhapus dari keranjang.
 *
 * @param cartItemId - ID unik item keranjang belanja.
 * @param delta - Nilai penambahan (+1) atau pengurangan (-1).
 *
 * @example
 * updateCartItemQty("cart-item-123", 1);  // Tambah 1 porsi
 * updateCartItemQty("cart-item-123", -1); // Kurangi 1 porsi
 */
const updateCartItemQty = (cartItemId: string, delta: number): void;
```

---

### 3.3 `callWaiter`
Memanggil pelayan untuk mendatangi nomor meja pemesan dengan pengaman batas waktu panggil (*cooldown*).

```typescript
/**
 * Mengirimkan sinyal pemanggilan pelayan dari meja pelanggan ke terminal kasir.
 * Memiliki proteksi cooldown 60 detik untuk mencegah spam penekanan tombol.
 *
 * @returns Promise<void>
 *
 * @example
 * await callWaiter();
 */
const callWaiter = async (): Promise<void>;
```
