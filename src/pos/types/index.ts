export type UserRole = 'kasir' | 'cashier' | 'admin' | 'kitchen' | 'owner';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  shift: string;
  terminal: string;
}

export type TableStatus = 
  | 'kosong' 
  | 'terisi' 
  | 'checkout' 
  | 'diproses' 
  | 'siap_diantar' 
  | 'draf' 
  | 'terkirim';

export interface OrderItemSummary {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  orderItemId?: number | string;
  orderId?: number | string;
}

export interface CurrentOrder {
  orderId: string;
  billId: string;
  customerName: string;
  guestCount: number;
  items: OrderItemSummary[];
  subtotal: number;
  total: number;
  openedAt: string;
  waiterName: string;
  elapsedInfo?: string;
}

export interface TableItem {
  id: string;
  dbId?: number;
  qrToken?: string;
  sessionId?: number;
  number: string;
  name?: string;
  capacity: number;
  status: TableStatus;
  statusLabel: string;
  guestCount?: number;
  totalFormatted?: string;
  totalRaw?: number;
  billId?: string;
  infoSubtitle?: string;
  qrCodeId: string;
  qrUrl: string;
  area: string;
  items?: OrderItemSummary[];
}

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  category: string;
  dbId?: number;
  price: number;
  description: string;
  image: string;
  isAvailable: boolean;
  isFavorite?: boolean;
  isSignature?: boolean;
  isRecommended?: boolean;
  portionsSold?: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

export interface SplitPaymentDetail {
  method1: 'Tunai' | 'QRIS' | 'Kartu Debit';
  amount1: number;
  method2: 'Tunai' | 'QRIS' | 'Kartu Debit';
  amount2: number;
}

export interface StoreSettings {
  selfOrderEnabled: boolean;       // Sistem pembayaran / order mandiri (jika off: panggil pelayan manual)
  soundEnabled: boolean;           // Suara aktif / notif ding pesanan & panggilan
  soundStation?: string;           // Filter area stasiun suara (Semua Bagian / Dapur Utama / Bar Minuman)
  openHour: string;                // Format "08:00"
  closeHour: string;               // Format "22:00"
  forceClose: boolean;             // Tutup sementara (hari libur/khusus)
  kdsEnabled?: boolean;            // Pantau pesanan (KDS) aktif / nonaktif
  enableKitchenDisplay?: boolean;  // Alias kdsEnabled
  autoInventoryDeduction?: boolean;// Fitur stok bahan baku (on: sesuai stok, off: manual)
  enableInventoryTracking?: boolean; // Alias autoInventoryDeduction
  enableTax?: boolean;             // Modular on/off Pajak Restoran PB1 (default true)
  taxName?: string;                // Nama label pajak (default "PB1 (Pajak Restoran)")
  taxRate?: number;                // Tarif pajak dalam persen (default 10)
  enableServiceCharge?: boolean;   // Modular on/off Biaya Layanan (default true)
  serviceChargeName?: string;      // Nama label biaya layanan (default "Biaya Layanan")
  serviceChargeRate?: number;      // Tarif biaya layanan dalam persen (default 5)
  roundingRule?: 'none' | '100' | '500' | '1000'; // Aturan pembulatan (default 'none')
  enableGuestWifi?: boolean;       // Modular on/off WiFi tamu restoran (default true)
  wifiSsid?: string;               // Nama SSID / username WiFi (default "RawonGusti_VIP")
  wifiPassword?: string;           // Password WiFi tamu (default "rawonenak08")
  receiptPaperSize?: '58mm' | '80mm'; // Lebar kertas printer termal (default '58mm')
}

export interface CashierShift {
  isOpen: boolean;
  modalAwal: number;
  kasMasuk: number;
  totalLaci: number;
  openedAt?: string;
  openedBy?: string;
  closedAt?: string;
  physicalCash?: number;
  cashDifference?: number;
}

export interface BillItem {
  id: string;
  sessionId?: number;
  billNumber: string;
  tableNumber: string;
  secondaryTables?: string[];
  customerName: string;
  guestCount: number;
  itemCount: number;
  items: OrderItemSummary[];
  subtotal: number;
  serviceFee: number;
  tax: number;
  total: number;
  requestedAt: string;
  elapsedMinutesAgo: number;
  waiterName: string;
  openedAtTime: string;
  status: 'minta_checkout' | 'belum_dibayar' | 'lunas';
  paymentMethod?: 'tunai' | 'qris' | 'debit' | 'split';
  splitDetail?: SplitPaymentDetail;
  cashTendered?: number;
  changeAmount?: number;
  paidAtTime?: string;
  isAllServed?: boolean;
  unservedCount?: number;
  orderType?: 'dine_in' | 'takeaway';
  isTakeaway?: boolean;
  takeawayQueue?: string;
}

export interface TransactionRecord {
  id: string;
  code: string; // e.g. #A014
  time: string; // e.g. 12:27
  at?: string;  // ISO timestamp for date filtering
  typeMeja: string; // e.g. Meja 12 atau Meja 01 + Meja 03
  source: 'QR meja' | 'Manual';
  method: 'Tunai' | 'QRIS' | 'Kartu Debit' | 'Split Payment';
  splitDetail?: SplitPaymentDetail;
  subtotal: number;
  tax: number;
  total: number;
  status: 'Lunas' | 'Batal';
  billData?: BillItem;
}

export interface KitchenTicketItem {
  name: string;
  quantity: number;
  notes?: string;
  isDone?: boolean;
  isDrink?: boolean;
}

export interface KitchenTicket {
  id: string;
  orderId?: number;
  ticketNumber: string; // #1048
  tableNumber: string; // 12, 08, 02, etc.
  type: 'Santap di Tempat' | 'Bawa Pulang';
  waiterName: string;
  elapsedSeconds: number;
  status: 'new' | 'preparing' | 'ready' | 'served';
  items: KitchenTicketItem[];
  station: 'Dapur Utama (Makanan)' | 'Bar Minuman' | 'Semua Bagian' | 'Stasiun Rawon & Dapur Panas' | 'Semua Stasiun';
  isPriority?: boolean;
  totalItems: number;
  totalAmount?: number;
  readySecondsAgo?: number;
  notesBanner?: string;
  takeawayQueue?: string;
  customerName?: string;
  orderTime?: string;
}

export interface RawIngredient {
  id: string;
  code: string;
  name: string;
  category: 'Daging & Unggas' | 'Bumbu & Rempah' | 'Beras & Pokok' | 'Sayur & Pelengkap' | 'Minuman';
  currentStock: number;
  minimumStock: number;
  unit: string;
  costPerUnit: number;
  supplier?: string;
  lastRestocked: string;
  linkedMenuItems: string[];
}

