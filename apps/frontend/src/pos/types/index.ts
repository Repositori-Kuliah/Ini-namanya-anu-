export type UserRole = 'kasir' | 'admin' | 'kitchen';

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
  portionsSold?: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

export interface BillItem {
  id: string;
  sessionId?: number;
  billNumber: string;
  tableNumber: string;
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
  paymentMethod?: 'tunai' | 'qris' | 'debit';
  cashTendered?: number;
  changeAmount?: number;
  paidAtTime?: string;
  isAllServed?: boolean;
  unservedCount?: number;
}

export interface TransactionRecord {
  id: string;
  code: string; // e.g. #A014
  time: string; // e.g. 12:27
  at?: string;  // ISO timestamp for date filtering
  typeMeja: string; // e.g. Meja 12 or Take away • Rina
  source: 'QR meja' | 'Manual';
  method: 'Tunai' | 'QRIS' | 'Kartu Debit';
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
}

export interface KitchenTicket {
  id: string;
  orderId?: number;
  ticketNumber: string; // #1048
  tableNumber: string; // 12, 08, 02, etc.
  type: 'Dine in' | 'Take away';
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
  supplier: string;
  lastRestocked: string;
  linkedMenuItems: string[];
}

