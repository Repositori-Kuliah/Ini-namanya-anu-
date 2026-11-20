export interface ExtraOption {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface MenuItem {
  id: string;
  dbId?: number;
  name: string;
  price: number;
  description: string;
  longDescription?: string;
  category: string;
  categories: string[];
  badge?: {
    text: string;
    type: 'best_seller' | 'chef' | 'favorite' | 'heritage' | 'region';
  };
  tags: string[];
  image: string;
  heroImage?: string;
  rating?: number;
  reviewCount?: number;
}

export interface CustomizationSelection {
  kuah: 'campur' | 'pisah';
  pedas: '0' | '1' | '2'; // 0: Tidak Pedas, 1: Sedang, 2: Mantap 🔥
  sayur?: 'lengkap' | 'pisah';
  extras: string[]; // names of selected extras
  kitchenNotes?: string;
}

export interface CartItem {
  cartItemId: string;
  menuItemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  customization: CustomizationSelection;
  extraCost: number;
  totalPrice: number;
  image: string;
  subtitleDesc: string;
}

export interface OrderItemSummary {
  name: string;
  price: number;
  quantity: number;
  details: string[];
  image: string;
}

export interface ActiveOrder {
  ticketNumber: string;
  tableNumber: string;
  tableArea: string;
  guestsCount: number;
  orderTime: string;
  orderTimestamp: number;
  items: CartItem[];
  tableNotes: string;
  paymentMethod: 'qris' | 'cashier';
  paymentStatus: 'LUNAS' | 'MENUNGGU DI KASIR';
  orderNumbers?: string[];
  statusStage: 1 | 2 | 3 | 4; // 1: Diterima, 2: Dimasak, 3: Siap Diantar, 4: Terhidang
  estimatedMinutes: string;
  subtotal: number;
  serviceFee: number;
  tax: number;
  total: number;
}

export type ScreenType = 'welcome' | 'menu' | 'detail' | 'cart' | 'status';
