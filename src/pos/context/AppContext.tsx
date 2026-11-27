import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  UserRole, StaffUser, TableItem, TableStatus, MenuItem, CartItem, BillItem,
  TransactionRecord, KitchenTicket, RawIngredient, OrderItemSummary,
  StoreSettings, CashierShift, SplitPaymentDetail,
} from '../types';
import { supabase } from '../../lib/supabase';
import { bill, billOfOrders, itemsSubtotal, splitFees, subtotalOf, today, type BillOptions } from '../../lib/domain';
import { placeholderImage, isPlaceholder } from '../../lib/placeholder';

export type AppView =
  | 'login' | 'meja-dan-pelanggan' | 'pesanan-baru' | 'checkout' | 'pembayaran'
  | 'pantau-pesanan' | 'dashboard' | 'kelola-menu' | 'kelola-meja' | 'akun-staf-dan-role' | 'laporan' | 'pengaturan';

interface ToastNotification { id: string; message: string; type?: 'success' | 'info' | 'warning'; }
type PayMethod = 'Tunai' | 'QRIS' | 'Kartu Debit';

interface AppContextType {
  currentUser: StaffUser;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  updateCurrentUserName: (name: string) => void;
  isLoggedIn: boolean;
  authLoading: boolean;
  /** true setelah data pertama selesai dimuat dari database. */
  dataReady: boolean;
  /** Mengembalikan pesan error, atau null bila berhasil. */
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;

  activeView: AppView;
  setActiveView: (view: AppView) => void;
  viewportMode: 'auto' | 'mobile' | 'desktop';
  setViewportMode: (mode: 'auto' | 'mobile' | 'desktop') => void;
  outletName: string;
  setOutletName: (name: string) => void;

  tables: TableItem[];
  selectedTableId: string;
  setSelectedTableId: (id: string) => void;
  updateTable: (table: TableItem, newStatus?: TableStatus) => Promise<boolean>;
  addTable: (tableNumber: number, capacity: number, area: string) => Promise<boolean>;
  deleteTable: (tableId: number) => Promise<boolean>;
  clearTableSession: (tableNumberOrSessionId: string | number) => Promise<void>;
  voidOrderItem: (tableNumberOrSessionId: string | number, item: OrderItemSummary, reason?: string, qtyToVoid?: number) => Promise<void>;
  voidTableOrder: (tableNumberOrSessionId: string | number, reason?: string) => Promise<void>;

  cartItems: CartItem[];
  orderType: 'dine_in' | 'takeaway';
  setOrderType: (type: 'dine_in' | 'takeaway') => void;
  takeawayNextQueue: string;
  orderTableNumber: string;
  setOrderTableNumber: (tableNumber: string) => void;
  orderSecondaryTables: string[];
  setOrderSecondaryTables: React.Dispatch<React.SetStateAction<string[]>>;
  orderCustomerName: string;
  setOrderCustomerName: (name: string) => void;
  orderGuestCount: number;
  setOrderGuestCount: (count: number) => void;
  kitchenGeneralNote: string;
  setKitchenGeneralNote: (note: string) => void;
  addToCart: (item: MenuItem, quantity?: number, notes?: string) => void;
  removeFromCart: (menuItemId: string) => void;
  updateCartQuantity: (menuItemId: string, delta: number) => void;
  updateCartItemNotes: (menuItemId: string, notes: string) => void;
  clearCart: () => void;
  sendOrderToKitchen: () => Promise<boolean>;
  saveDraftOrder: () => Promise<boolean>;

  bills: BillItem[];
  selectedBillId: string;
  setSelectedBillId: (id: string) => void;
  selectedBill: BillItem | undefined;
  settlePayment: (billId: string, method: PayMethod | 'Split Payment', amountTendered?: number, splitDetail?: SplitPaymentDetail) => void;

  menuItems: MenuItem[];
  menuCategories: string[];
  updateMenuItem: (item: MenuItem) => void;
  addMenuItem: (item: MenuItem) => void;
  toggleMenuItemAvailability: (itemId: number | string) => Promise<void>;

  rawIngredients: RawIngredient[];
  lowStockIngredients: RawIngredient[];
  updateIngredientStock: (id: string, newStock: number) => void;
  restockIngredient: (id: string, addedStock: number) => void;
  updateIngredientMinimum: (id: string, newMin: number) => void;
  addRawIngredient: (ingredient: RawIngredient) => void;
  dismissStockWarning: boolean;
  setDismissStockWarning: (dismissed: boolean) => void;

  deleteMenuItem: (itemId: number | string) => Promise<boolean>;
  deleteRawIngredient: (ingredientId: number | string) => Promise<boolean>;
  refresh: () => Promise<void>;
  isOnline: boolean;

  kitchenTickets: KitchenTicket[];
  advanceTicketStatus: (ticketId: string) => void;
  completeKitchenTicket: (ticketId: string) => void;

  transactions: TransactionRecord[];
  recentReceipts: BillItem[];

  toast: ToastNotification | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
  receiptModalData: BillItem | null;
  openReceiptModal: (bill: BillItem) => void;
  closeReceiptModal: () => void;

  desktopSidebarOpen: boolean;
  setDesktopSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleDesktopSidebar: () => void;

  storeSettings: StoreSettings;
  updateStoreSettings: (partial: Partial<StoreSettings>) => void;
  cashierShift: CashierShift;
  openCashierShift: (modalAwal: number) => void;
  closeCashierShift: (physicalCash: number) => { difference: number };
  playDingSound: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ---------- helper tampilan ----------
const pad = (n: number | string) => {
  const num = typeof n === 'number' ? n : parseInt(String(n), 10);
  if (isNaN(num) || num <= 0) return '01';
  return String(num).padStart(2, '0');
};
const WIB = 'Asia/Jakarta';
const hhmm = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: WIB }).replace(':', '.') : '-');
const hhmmColon = (iso: string) => hhmm(iso).replace('.', ':');
const minsSince = (iso?: string | null) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000)) : 0);
const idDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: WIB }) : '-');
const rp = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

const ROLE_FROM_DB: Record<string, UserRole> = { admin: 'admin', owner: 'owner', staff: 'kasir', cashier: 'kasir', kitchen: 'kitchen' };
const ROLE_TO_DB: Record<string, string> = { admin: 'admin', owner: 'owner', kasir: 'cashier', kitchen: 'kitchen' };
const METHOD_TO_DB: Record<PayMethod, string> = { Tunai: 'cash', QRIS: 'qris', 'Kartu Debit': 'debit' };
const METHOD_FROM_DB: Record<string, TransactionRecord['method']> = { cash: 'Tunai', qris: 'QRIS', debit: 'Kartu Debit' };
const BAR_CATEGORIES = ['Teh', 'Kopi', 'Wedang', 'Lainnya'];

const STATUS_LABEL: Record<TableStatus, string> = {
  kosong: 'Tersedia', terisi: 'Terisi', checkout: 'Terisi', diproses: 'Terisi',
  siap_diantar: 'Terisi', draf: 'Terisi', terkirim: 'Terisi',
};
const ORDER_TO_TABLE: Record<string, TableStatus> = { submitted: 'terkirim', preparing: 'diproses', ready: 'siap_diantar', served: 'terisi' };
const ORDER_TO_TICKET: Record<string, KitchenTicket['status']> = { submitted: 'new', preparing: 'preparing', ready: 'ready', served: 'served' };

const GUEST_USER: StaffUser = { id: '', name: '', email: '', role: 'kasir', avatar: '', shift: '', terminal: '' };
const toStaffUser = (p: any, email: string): StaffUser => ({
  id: p.id, name: p.full_name, email: p.email || email, role: ROLE_FROM_DB[p.role] ?? 'kasir',
  avatar: '', shift: p.shift || '', terminal: p.terminal || '',
});
const homeView = (r: UserRole): AppView => (r === 'kitchen' ? 'pantau-pesanan' : (r === 'admin' || r === 'owner') ? 'dashboard' : 'meja-dan-pelanggan');

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<StaffUser>(GUEST_USER);
  const [currentRole, setCurrentRoleState] = useState<UserRole>('kasir');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [activeView, setActiveViewState] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('rg_pos_active_view');
        if (saved && saved !== 'login') return saved as AppView;
      } catch {}
    }
    return 'meja-dan-pelanggan';
  });

  const setActiveView = useCallback((view: AppView) => {
    setActiveViewState(view);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('rg_pos_active_view', view);
      } catch {}
    }
  }, []);
  const [viewportMode, setViewportMode] = useState<'auto' | 'mobile' | 'desktop'>('auto');
  const [outletName, setOutletName] = useState('Rawon Gusti Surabaya');
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const toggleDesktopSidebar = useCallback(() => {
    setDesktopSidebarOpen((prev) => !prev);
  }, []);

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Bersihkan sisa cache mock lama di localStorage agar murni 100% online dari Supabase
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('rg_mock_sessions_v2');
        localStorage.removeItem('rg_pos_master_cache_v2');
        localStorage.removeItem('rg_recent_receipts');
        localStorage.removeItem('rg_mock_staff_list');
      } catch {}
    }
  }, []);

  // Data murni langsung dari database Supabase (tanpa fallback dummy cache)
  const [rawTables, setRawTables] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [rawIngredients, setRawIngredients] = useState<RawIngredient[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());

  // state UI
  const [selectedTableId, setSelectedTableId] = useState('');
  const [orderTableNumber, setOrderTableNumber] = useState('');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [orderSecondaryTables, setOrderSecondaryTables] = useState<string[]>([]);
  const [orderCustomerName, setOrderCustomerName] = useState('');
  const [orderGuestCount, setOrderGuestCount] = useState(2);
  const [kitchenGeneralNote, setKitchenGeneralNote] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedBillId, setSelectedBillId] = useState('');
  const [dismissStockWarning, setDismissStockWarning] = useState(false);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [receiptModalData, setReceiptModalData] = useState<BillItem | null>(null);

  // Penomoran antrean bungkus mandiri otomatis (Antrean 01, Antrean 02, dst.)
  const takeawayNextQueue = useMemo(() => {
    const activeTakeaways = sessions.filter(
      (s) => s.is_takeaway || s.takeaway_queue || s.orders?.some((o: any) => o.note?.includes('[BAWA PULANG]'))
    );
    return `Antrean ${String(activeTakeaways.length + 1).padStart(2, '0')}`;
  }, [sessions]);

  // Store Settings (persisten di localStorage)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('rg_pos_store_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          soundEnabled: parsed.soundEnabled ?? true,
          soundStation: parsed.soundStation || 'Semua Bagian',
          openHour: parsed.openHour || '08:00',
          closeHour: parsed.closeHour || '22:00',
          forceClose: parsed.forceClose ?? false,
          kdsEnabled: parsed.kdsEnabled ?? parsed.enableKitchenDisplay ?? true,
          enableKitchenDisplay: parsed.enableKitchenDisplay ?? parsed.kdsEnabled ?? true,
          autoInventoryDeduction: parsed.autoInventoryDeduction ?? parsed.enableInventoryTracking ?? true,
          enableInventoryTracking: parsed.enableInventoryTracking ?? parsed.autoInventoryDeduction ?? true,
          enableTax: parsed.enableTax ?? true,
          taxName: parsed.taxName || 'PB1 (Pajak Restoran)',
          taxRate: parsed.taxRate ?? 10,
          enableServiceCharge: parsed.enableServiceCharge ?? true,
          serviceChargeName: parsed.serviceChargeName || 'Biaya Layanan',
          serviceChargeRate: parsed.serviceChargeRate ?? 5,
          roundingRule: parsed.roundingRule || 'none',
          enableGuestWifi: parsed.enableGuestWifi ?? true,
          wifiSsid: parsed.wifiSsid || 'RawonGusti_VIP',
          wifiPassword: parsed.wifiPassword || 'rawonenak08',
          receiptPaperSize: parsed.receiptPaperSize || '58mm',
        };
      }
    } catch {}
    return {
      soundEnabled: true,
      soundStation: 'Semua Bagian',
      openHour: '08:00',
      closeHour: '22:00',
      forceClose: false,
      kdsEnabled: true,
      enableKitchenDisplay: true,
      autoInventoryDeduction: true,
      enableInventoryTracking: true,
      enableTax: true,
      taxName: 'PB1 (Pajak Restoran)',
      taxRate: 10,
      enableServiceCharge: true,
      serviceChargeName: 'Biaya Layanan',
      serviceChargeRate: 5,
      roundingRule: 'none',
      enableGuestWifi: true,
      wifiSsid: 'RawonGusti_VIP',
      wifiPassword: 'rawonenak08',
      receiptPaperSize: '58mm',
    };
  });

  const updateStoreSettings = useCallback((partial: Partial<StoreSettings>) => {
    setStoreSettings((prev) => {
      const updated = { ...prev, ...partial };
      if ('kdsEnabled' in partial && !('enableKitchenDisplay' in partial)) {
        updated.enableKitchenDisplay = partial.kdsEnabled;
      }
      if ('enableKitchenDisplay' in partial && !('kdsEnabled' in partial)) {
        updated.kdsEnabled = partial.enableKitchenDisplay;
      }
      if ('autoInventoryDeduction' in partial && !('enableInventoryTracking' in partial)) {
        updated.enableInventoryTracking = partial.autoInventoryDeduction;
      }
      if ('enableInventoryTracking' in partial && !('autoInventoryDeduction' in partial)) {
        updated.autoInventoryDeduction = partial.enableInventoryTracking;
      }
      try {
        localStorage.setItem('rg_pos_store_settings', JSON.stringify(updated));
      } catch {}

      // Sinkronisasi online ke tabel store_settings di Supabase
      supabase
        .from('store_settings')
        .update({
          tax_name: updated.taxName,
          tax_rate: updated.taxRate,
          enable_tax: updated.enableTax,
          service_charge_name: updated.serviceChargeName,
          service_charge_rate: updated.serviceChargeRate,
          enable_service_charge: updated.enableServiceCharge,
          guest_wifi_ssid: updated.wifiSsid,
          guest_wifi_password: updated.wifiPassword,
          kds_enabled: updated.enableKitchenDisplay,
          auto_inventory_deduction: updated.enableInventoryTracking,
          open_hour: updated.openHour,
          close_hour: updated.closeHour,
          force_close: updated.forceClose,
          sound_enabled: updated.soundEnabled,
          sound_station: updated.soundStation,
          rounding_rule: updated.roundingRule,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_id', 1)
        .then(() => {});

      // Sinkronisasi terpisah agar pengaturan lain tetap tersimpan bila kolom belum dimigrasi
      if ('receiptPaperSize' in partial) {
        supabase
          .from('store_settings')
          .update({ receipt_paper_size: updated.receiptPaperSize })
          .eq('setting_id', 1)
          .then(() => {});
      }

      return updated;
    });
  }, []);

  // Audio Ding Helper (Web Audio API - offline, tanpa file luar)
  const playDingSound = useCallback(() => {
    if (!storeSettings.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.35);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.85);
    } catch (e) {
      console.warn('Audio Ding not supported or blocked by user gesture', e);
    }
  }, [storeSettings.soundEnabled]);

  // Cashier Shift State (Buka Kasir & Tutup Kasir Laci)
  const [cashierShift, setCashierShift] = useState<CashierShift>(() => {
    try {
      const saved = localStorage.getItem('rg_pos_cashier_shift');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      isOpen: false,
      modalAwal: 0,
      kasMasuk: 0,
      totalLaci: 0,
      openedAt: new Date().toISOString(),
      openedBy: 'Kasir',
    };
  });

  const openCashierShift = useCallback((modalAwal: number) => {
    const shift: CashierShift = {
      isOpen: true,
      modalAwal,
      kasMasuk: 0,
      totalLaci: modalAwal,
      openedAt: new Date().toISOString(),
      openedBy: currentUser.name || 'Kasir',
    };
    setCashierShift(shift);
    try {
      localStorage.setItem('rg_pos_cashier_shift', JSON.stringify(shift));
    } catch {}
  }, [currentUser.name]);

  const closeCashierShift = useCallback((physicalCash: number) => {
    const diff = physicalCash - cashierShift.totalLaci;
    const closed: CashierShift = {
      ...cashierShift,
      isOpen: false,
      physicalCash,
      cashDifference: diff,
      closedAt: new Date().toISOString(),
    };
    setCashierShift(closed);
    try {
      localStorage.setItem('rg_pos_cashier_shift', JSON.stringify(closed));
    } catch {}
    return { difference: diff };
  }, [cashierShift]);

  // In-memory receipts untuk sesi transaksi kasir aktif (tanpa ketergantungan localStorage)
  const [inMemoryReceipts, setInMemoryReceipts] = useState<BillItem[]>([]);
  const saveRecentReceipt = useCallback((receipt: BillItem) => {
    setInMemoryReceipts((prev) => [receipt, ...prev.filter((r) => r.id !== receipt.id && r.billNumber !== receipt.billNumber)].slice(0, 50));
  }, []);

  const rawTablesRef = useRef<any[]>([]);
  rawTablesRef.current = rawTables;
  const seenRequests = useRef<Set<number> | null>(null);
  const roleRef = useRef<UserRole>('kasir');
  const currentUserRef = useRef<StaffUser>(GUEST_USER);
  currentUserRef.current = currentUser;

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    setToast({ id, message, type });
    setTimeout(() => setToast((c) => (c?.id === id ? null : c)), 2800);
  }, []);

  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;
  const playDingSoundRef = useRef(playDingSound);
  playDingSoundRef.current = playDingSound;

  // ---------- muat data katalog statis (hybrid offline-online) ----------
  const loadMasterData = useCallback(async () => {
    try {
      const [cats, prods, tbls, ings, stRes] = await Promise.all([
        supabase.from('categories').select('*').order('category_id'),
        supabase.from('products').select('*, categories(name)').order('product_id'),
        supabase.from('tables').select('*').eq('is_active', true).order('table_number'),
        supabase.from('ingredients').select('*').order('ingredient_id'),
        supabase.from('store_settings').select('*').limit(1).maybeSingle(),
      ]);

      const loadedCats = cats.data || [];
      const loadedProds = prods.data || [];
      const loadedTbls = tbls.data || [];
      const loadedIngs = ings.data ? ings.data.map((i: any): RawIngredient => ({
        id: String(i.ingredient_id), code: i.code, name: i.name, category: i.category,
        currentStock: Number(i.current_stock), minimumStock: Number(i.minimum_stock), unit: i.unit,
        costPerUnit: Number(i.cost_per_unit), supplier: i.supplier || '-',
        lastRestocked: idDate(i.last_restocked), linkedMenuItems: i.linked_menu_items || [],
      })) : [];

      if (stRes.data) {
        const st = stRes.data;
        setStoreSettings((prev) => ({
          ...prev,
          enableTax: st.enable_tax ?? prev.enableTax,
          taxName: st.tax_name || prev.taxName,
          taxRate: st.tax_rate != null ? Number(st.tax_rate) : prev.taxRate,
          enableServiceCharge: st.enable_service_charge ?? prev.enableServiceCharge,
          serviceChargeName: st.service_charge_name || prev.serviceChargeName,
          serviceChargeRate: st.service_charge_rate != null ? Number(st.service_charge_rate) : prev.serviceChargeRate,
          wifiSsid: st.guest_wifi_ssid || prev.wifiSsid,
          wifiPassword: st.guest_wifi_password || prev.wifiPassword,
          openHour: st.open_hour || prev.openHour,
          closeHour: st.close_hour || prev.closeHour,
          forceClose: st.force_close ?? prev.forceClose,
          kdsEnabled: st.kds_enabled ?? prev.kdsEnabled,
          enableKitchenDisplay: st.kds_enabled ?? prev.enableKitchenDisplay,
          autoInventoryDeduction: st.auto_inventory_deduction ?? prev.autoInventoryDeduction,
          enableInventoryTracking: st.auto_inventory_deduction ?? prev.enableInventoryTracking,
          soundEnabled: st.sound_enabled ?? prev.soundEnabled,
          soundStation: st.sound_station || prev.soundStation,
          roundingRule: st.rounding_rule || prev.roundingRule,
          receiptPaperSize: st.receipt_paper_size || prev.receiptPaperSize,
        }));
      }

      setCategories(loadedCats);
      setProducts(loadedProds);
      setRawTables(loadedTbls);
      setRawIngredients(loadedIngs);
    } catch (e) {
      console.error('[supabase master load error]', e);
    }
  }, []);

  // ---------- muat data operasional dinamis ----------
  const refreshDynamic = useCallback(async () => {
    const role = roleRef.current;
    const canSeeMoney = role !== 'kitchen';
    try {
      const [ses, reqs, pays] = await Promise.all([
        supabase.from('table_sessions')
          .select('session_id,table_id,guest_count,customer_name,opened_at,is_takeaway,takeaway_queue,orders(order_id,order_number,order_status,order_source,total,note,created_at,ready_at,served_at,order_items(order_item_id,product_id,product_name,unit_price,quantity,note))')
          .is('closed_at', null),
        supabase.from('service_requests').select('*').eq('status', 'pending'),
        canSeeMoney
          ? supabase.from('payments').select('payment_id,transaction_code,method,amount,cash_received,change_amount,paid_at,orders(order_id,order_number,order_source,total,created_at,table_sessions(session_id,customer_name,guest_count,tables(table_number),orders(order_id,order_number,total,order_items(order_item_id,product_name,unit_price,quantity,note))),order_items(order_item_id,product_name,unit_price,quantity,note))')
              .eq('status', 'paid').gte('paid_at', today() + 'T00:00:00+07:00').order('paid_at', { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);

      const reqData = reqs.data ?? [];
      const tblData = rawTablesRef.current;

      if (ses.data) {
        setSessions(ses.data);
      } else {
        setSessions([]);
      }
      if (reqs.data) setRequests(reqData);
      if (pays.data) setPayments(pays.data);

      // Notifikasi suara & toast jika ada permintaan meja baru
      const prev = seenRequests.current;
      if (prev && role !== 'kitchen') {
        const newReqs = reqData.filter((r: any) => !prev.has(r.request_id));
        if (newReqs.length > 0) {
          playDingSoundRef.current();
          newReqs.forEach((r: any) => {
            const t = tblData.find((x: any) => x.table_id === r.table_id);
            showToastRef.current(`Meja ${pad(t?.table_number ?? '?')} ${r.kind === 'checkout' ? 'minta tagihan' : 'memanggil pelayan'}`, 'warning');
          });
        }
      }
      seenRequests.current = new Set(reqData.map((r: any) => r.request_id));
      setDataReady(true);
    } catch (e) {
      console.warn('[supabase dynamic refresh error]', e);
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadMasterData(), refreshDynamic()]);
  }, [loadMasterData, refreshDynamic]);

  // ---------- auth ----------
  const loadProfile = async (uid: string, email: string, authUser?: any): Promise<StaffUser | null> => {
    // 1. Cari berdasarkan id uid di profiles
    let { data } = await supabase.from('profiles').select('*').eq('id', uid).eq('is_active', true).maybeSingle();
    // 2. Jika tidak ditemukan berdasarkan id (misal auth dibuat via dashboard), cari berdasarkan email
    if (!data && email) {
      const res = await supabase.from('profiles').select('*').eq('email', email.toLowerCase()).eq('is_active', true).maybeSingle();
      data = res.data;
    }
    // 3. Fallback jika tabel profiles belum disinkronkan / RLS mengunci: baca langsung metadata akun Supabase Auth
    if (!data && authUser) {
      const metaRole = authUser.user_metadata?.role || authUser.app_metadata?.role;
      const metaName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Staf';
      if (metaRole && (['admin', 'owner', 'staff', 'kitchen', 'cashier'].includes(metaRole) || ROLE_FROM_DB[metaRole])) {
        return {
          id: uid,
          name: metaName,
          email: email,
          role: ROLE_FROM_DB[metaRole] ?? (metaRole as UserRole),
          avatar: '',
          shift: 'Shift Aktif',
          terminal: 'Terminal POS #01',
        };
      }
    }
    if (!data) return null;
    return ['admin', 'owner', 'staff', 'kitchen', 'cashier'].includes(data.role) ? toStaffUser(data, email) : null;
  };
  const enter = (u: StaffUser, redirect = false) => {
    roleRef.current = u.role;
    currentUserRef.current = u;
    setCurrentUser(u);
    setCurrentRoleState(u.role);
    setIsLoggedIn(true);

    // Simpan timestamp sesi masuk jika belum ada (durasi maks. 24 jam)
    if (typeof window !== 'undefined') {
      try {
        if (!localStorage.getItem('pos.session_login_time')) {
          localStorage.setItem('pos.session_login_time', Date.now().toString());
        }
      } catch {}
    }

    if (redirect) {
      setActiveView(homeView(u.role));
    } else {
      const saved = typeof window !== 'undefined' ? (sessionStorage.getItem('rg_pos_active_view') as AppView | null) : null;
      if (saved && saved !== 'login') {
        setActiveViewState(saved);
      } else {
        setActiveView(homeView(u.role));
      }
    }
  };

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session;

      // Evaluasi batas masa aktif sesi: 24 jam (86.400.000 ms)
      const MAX_SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
      let isExpired = false;
      if (typeof window !== 'undefined') {
        try {
          const sessionLoginTime = localStorage.getItem('pos.session_login_time');
          if (sessionLoginTime && Date.now() - Number(sessionLoginTime) > MAX_SESSION_DURATION_MS) {
            isExpired = true;
            localStorage.removeItem('pos.session_login_time');
          }
        } catch {}
      }

      if (isExpired && s) {
        await supabase.auth.signOut();
        if (alive) {
          setIsLoggedIn(false);
          setCurrentUser(GUEST_USER);
          setAuthLoading(false);
        }
        return;
      }

      const u = s ? await loadProfile(s.user.id, s.user.email || '', s.user) : null;
      if (!alive) return;
      if (u) {
        enter(u, false);
      } else if (s) {
        await supabase.auth.signOut();
      }
      setAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!alive) return;
      if (event === 'SIGNED_IN' && session) {
        // Abaikan jika user yang sama sudah aktif masuk (mencegah reset rute saat tab browser berpindah/kembali fokus)
        if (currentUserRef.current?.id === session.user.id) {
          return;
        }
        const u = await loadProfile(session.user.id, session.user.email || '', session.user);
        if (u) enter(u, false);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setCurrentUser(GUEST_USER);
        setActiveViewState('login');
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('rg_pos_active_view');
          } catch {}
        }
      }
    });

    return () => {
      alive = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    let cleanInput = emailOrUsername.trim().toLowerCase();

    // Resolusi cerdas: jika pengguna mengetik nama/username tanpa '@', cocokkan ke email resmi di database
    if (!cleanInput.includes('@')) {
      // Bersihkan karakter simbol seperti kurung () dan tanda baca agar aman untuk query PostgREST
      const sanitized = cleanInput.replace(/[()!@#$%^&*]/g, ' ').replace(/\s+/g, ' ').trim();
      const firstWord = sanitized.split(' ')[0] || sanitized;

      try {
        // 1. Cari profil aktif di database Supabase berdasarkan kecocokan nama
        const { data: matched } = await supabase
          .from('profiles')
          .select('email, full_name, role')
          .or(`full_name.ilike.%${sanitized}%,full_name.ilike.%${firstWord}%,role.ilike.%${firstWord}%`)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (matched?.email) {
          cleanInput = matched.email.toLowerCase();
        } else {
          // 2. Fallback kamus cepat akun demo jika database belum memiliki data
          const quickMap: Record<string, string> = {
            admin: 'admin@rawongusti.test',
            'budi admin': 'admin@rawongusti.test',
            'budi (admin)': 'admin@rawongusti.test',
            budi: 'admin@rawongusti.test',
            kasir: 'kasir@rawongusti.test',
            'dewi sartika': 'kasir@rawongusti.test',
            'dewi sartika (kasir)': 'kasir@rawongusti.test',
            dewi: 'kasir@rawongusti.test',
            dapur: 'dapur@rawongusti.test',
            kitchen: 'dapur@rawongusti.test',
            'chef sam': 'dapur@rawongusti.test',
            'chef sam (dapur)': 'dapur@rawongusti.test',
            sam: 'dapur@rawongusti.test',
            owner: 'owner@rawongusti.test',
            'haji gusti': 'owner@rawongusti.test',
            'haji gusti (owner)': 'owner@rawongusti.test',
            gusti: 'owner@rawongusti.test',
            rian: 'rian@rawongusti.test',
            'rian pratama': 'rian@rawongusti.test',
          };
          if (quickMap[cleanInput] || quickMap[sanitized]) {
            cleanInput = quickMap[cleanInput] || quickMap[sanitized];
          }
        }
      } catch (err) {
        console.warn('[login username resolution]', err);
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanInput, password });
      if (error) {
        return 'Email atau kata sandi salah.';
      }
      if (data?.user) {
        const u = await loadProfile(data.user.id, data.user.email || cleanInput, data.user);
        if (u) {
          enter(u, true);
          showToast(`Berhasil masuk sebagai ${u.role.toUpperCase()}`, 'success');
          return null;
        } else {
          await supabase.auth.signOut();
          return 'Email atau kata sandi salah.';
        }
      }
    } catch {
      return 'Email atau kata sandi salah.';
    }

    return 'Email atau kata sandi salah.';
  };
  const logout = () => {
    supabase.auth.signOut();
    setIsLoggedIn(false);
    setDataReady(false);
    setCurrentUser(GUEST_USER);
    setActiveViewState('login');
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('rg_pos_active_view');
        localStorage.removeItem('pos.session_login_time');
      } catch {}
    }
    seenRequests.current = null;
    setSessions([]);
    setPayments([]);
    showToast('Sesi berakhir. Sampai jumpa!');
  };
  // hanya admin & owner yang boleh "melihat sebagai" peran lain (pratinjau tampilan)
  const setCurrentRole = (r: UserRole) => { if (currentUser.role === 'admin' || currentUser.role === 'owner') setCurrentRoleState(r); };
  const updateCurrentUserName = (name: string) => {
    setCurrentUser((prev) => ({ ...prev, name }));
  };

  // Status koneksi jaringan
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToastRef.current('Koneksi internet aktif. Menyinkronkan data...', 'info');
      refresh();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToastRef.current('Koneksi internet terputus!', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refresh]);

  // Sinkronisasi realtime: HANYA mengambil data saat terjadi MUTASI nyata (INSERT, UPDATE, DELETE)
  // Tidak ada polling setiap 1 detik
  useEffect(() => {
    if (!isLoggedIn) return;
    refresh();

    let debounceTimer: ReturnType<typeof setTimeout>;
    const handleRealtimeChange = (payload: any) => {
      // HANYA ambil data baru saat ada mutasi data nyata (INSERT, UPDATE, DELETE)
      const eventType = payload?.eventType;
      if (!eventType || !['INSERT', 'UPDATE', 'DELETE'].includes(eventType)) return;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const table = payload?.table;
        if (['products', 'categories', 'tables', 'ingredients'].includes(table)) {
          loadMasterData();
        }
        refreshDynamic();
      }, 500);
    };

    const ch = supabase.channel('pos-mutations-live');
    ['orders', 'order_items', 'payments', 'table_sessions', 'service_requests', 'products', 'tables', 'ingredients'].forEach((t) =>
      ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, handleRealtimeChange));
    ch.subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(ch);
    };
  }, [isLoggedIn, refresh, loadMasterData, refreshDynamic]);

  // Fallback sinkronisasi berkala (setiap 10 detik) untuk memastikan pesanan QR mandiri & status meja selalu terpantau
  useEffect(() => {
    if (!isLoggedIn) return;
    const pollTimer = setInterval(() => {
      if (!document.hidden) {
        refreshDynamic();
      }
    }, 10000);
    return () => clearInterval(pollTimer);
  }, [isLoggedIn, refreshDynamic]);

  // Interval pembaruan menit diubah ke 30 detik (bukan setiap 1 detik) untuk efisiensi CPU & render
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // ---------- turunan: menu ----------
  const productCategory = useMemo(() => new Map(products.map((p) => [p.product_id, p.categories?.name as string])), [products]);
  const menuItems: MenuItem[] = useMemo(() => products.map((p) => {
    const isFav = Boolean(p.is_favorite || p.is_recommended);
    return {
      id: String(p.product_id), dbId: p.product_id, code: p.product_code, name: p.name,
      category: p.categories?.name ?? '-', price: Number(p.price), description: p.description || '',
      image: p.image_url || placeholderImage(p.name), isAvailable: p.is_available,
      isFavorite: isFav, isRecommended: isFav, isSignature: p.is_signature, portionsSold: 0,
    };
  }), [products]);
  const menuCategories = useMemo(() => categories.map((c) => c.name as string), [categories]);

  // Tagihan memakai tarif dari Pengaturan (bisa mematikan layanan 5% / PB1).
  const billOpts = useMemo<BillOptions>(() => ({
    enableService: storeSettings.enableServiceCharge ?? true,
    serviceRate: storeSettings.serviceChargeRate ?? 5,
    enableTax: storeSettings.enableTax ?? true,
    taxRate: storeSettings.taxRate ?? 10,
    roundingRule: storeSettings.roundingRule,
  }), [storeSettings]);

  // ---------- turunan: meja, tagihan, tiket dapur ----------
  const tables: TableItem[] = useMemo(() => {
    // Deduplikasi rawTables berdasarkan table_number agar tidak ada baris ganda
    const seen = new Set<string>();
    const uniqueRawTables = rawTables.filter((t) => {
      const numStr = pad(t.table_number);
      if (seen.has(numStr)) return false;
      seen.add(numStr);
      return true;
    });

    return uniqueRawTables.map((t) => {
      const s = sessions.find((x) => x.table_id === t.table_id);
      const base: TableItem = {
        id: `tbl-${pad(t.table_number)}`, dbId: t.table_id, number: pad(t.table_number),
        capacity: 4, area: 'Ruang Restoran', status: 'kosong', statusLabel: 'Tersedia',
      };
      if (!s) return base;
      const live = (s.orders || []).filter((o: any) => o.order_status !== 'draft' && o.order_status !== 'cancelled');
      const drafts = (s.orders || []).filter((o: any) => o.order_status === 'draft');
      const shown = live.length ? live : drafts;
      const req = requests.find((r) => r.table_id === t.table_id && r.kind === 'checkout');
      const has = (st: string) => live.find((o: any) => o.order_status === st);
      let status: TableStatus; let info = `Sejak ${hhmm(s.opened_at)}`;
      if (!live.length && !drafts.length) status = 'terisi';
      else if (!live.length) { status = 'draf'; info = 'Belum dikirim'; }
      else if (req) { status = 'checkout'; info = `Diminta ${hhmm(req.created_at)}`; }
      else if (has('preparing')) { status = 'diproses'; info = `Kitchen ${minsSince(has('preparing').created_at)} min`; }
      else if (has('submitted')) { status = 'terkirim'; info = `Antrean ${minsSince(has('submitted').created_at)} min`; }
      else if (has('ready')) { status = 'siap_diantar'; info = `Siap ${hhmm(has('ready').ready_at)}`; }
      else status = 'terisi';
      const items: OrderItemSummary[] = shown.flatMap((o: any) => (o.order_items || []).map((i: any) => ({
        name: i.product_name, quantity: i.quantity, price: i.unit_price * i.quantity, notes: i.note || undefined })));
      const totalRaw = shown.reduce((a: number, o: any) => a + Number(o.total || 0), 0);

      const statusLabel = 'Terisi';

      return { ...base, status, statusLabel, name: s.customer_name || undefined, guestCount: s.guest_count,
        totalRaw, totalFormatted: rp(totalRaw), billId: `${status === 'draf' ? 'D' : 'B'}-${s.session_id}`, infoSubtitle: info, sessionId: s.session_id, items };
    });
  }, [rawTables, sessions, requests, now]); // eslint-disable-line react-hooks/exhaustive-deps

  const bills: BillItem[] = useMemo(() => sessions.flatMap((s) => {
    const live = (s.orders || []).filter((o: any) =>
      o.order_status !== 'draft' &&
      o.order_status !== 'cancelled' &&
      o.order_status !== 'pending' &&
      o.order_status !== 'pending_confirmation'
    );
    if (!live.length) return [];
    const t = rawTables.find((x) => x.table_id === s.table_id);
    const { subtotal, service: serviceFee, tax, total } = bill(
      live.map((o: any) => itemsSubtotal(o.order_items)).reduce((acc: number, val: number) => acc + val, 0),
      billOpts,
    );

    const req = requests.find((r) => r.table_id === s.table_id && r.kind === 'checkout');
    const rawItems: OrderItemSummary[] = live.flatMap((o: any) => (o.order_items || []).map((i: any) => ({
      name: i.product_name, quantity: i.quantity, price: Number(i.unit_price), notes: i.note || undefined,
      orderItemId: i.order_item_id, orderId: o.order_id })));
    const itemMap = new Map<string, OrderItemSummary>();
    for (const it of rawItems) {
      const key = `${it.name}__${it.notes || ''}`;
      const existing = itemMap.get(key);
      if (existing) {
        existing.quantity += it.quantity;
      } else {
        itemMap.set(key, { ...it });
      }
    }
    const items: OrderItemSummary[] = Array.from(itemMap.values());
    const staffOrder = live.find((o: any) => o.profiles?.full_name);
    const unservedOrders = live.filter((o: any) => o.order_status !== 'served');
    const isAllServed = unservedOrders.length === 0;
    const isTakeaway = Boolean(s.is_takeaway) || live.some((o: any) => o.note?.includes('[BAWA PULANG]') || o.note?.includes('[TAKEAWAY]')) || Boolean(t?.area && t.area.toLowerCase().includes('takeaway'));
    const displayTableNumber = isTakeaway
      ? (s.takeaway_queue || 'Antrean 01')
      : pad(t?.table_number ?? '?');

    // Format ID unik standar POS:
    // Contoh takeaway: TA-261120-001, contoh dine-in: DIN-261120-001
    const orderDate = new Date(s.opened_at || Date.now());
    const yy = String(orderDate.getFullYear()).slice(-2);
    const mm = String(orderDate.getMonth() + 1).padStart(2, '0');
    const dd = String(orderDate.getDate()).padStart(2, '0');
    const dateCode = `${yy}${mm}${dd}`;

    const existingOrderNum = live[0]?.order_number;
    let uniqueBillNumber = '';
    if (existingOrderNum && (existingOrderNum.startsWith('TA-') || existingOrderNum.startsWith('DIN-'))) {
      uniqueBillNumber = existingOrderNum;
    } else {
      const rawSeq = s.session_id ? String(s.session_id) : '1';
      const seq = (rawSeq.length > 3 ? rawSeq.slice(-3) : rawSeq).padStart(3, '0');
      uniqueBillNumber = isTakeaway
        ? `TA-${dateCode}-${seq}`
        : `DIN-${dateCode}-${seq}`;
    }

    const rawCustName = (s.customer_name || '').trim();
    const isGenericName = !rawCustName ||
      rawCustName.toLowerCase() === 'tamu' ||
      rawCustName.toLowerCase() === 'pelanggan bungkus' ||
      rawCustName.toLowerCase().includes('tamu (bawa pulang)') ||
      rawCustName.toLowerCase().includes('pelanggan');
    const finalCustomerName = isGenericName
      ? (isTakeaway ? 'Pesanan Bawa Pulang' : `Tamu Meja ${displayTableNumber}`)
      : rawCustName;

    return [{
      id: `bill-${s.session_id}`, sessionId: s.session_id, billNumber: uniqueBillNumber, tableNumber: displayTableNumber,
      customerName: finalCustomerName, guestCount: s.guest_count, itemCount: items.reduce((a, i) => a + i.quantity, 0), items,
      subtotal, serviceFee, tax, total,
      requestedAt: req ? hhmmColon(req.created_at) : '-', elapsedMinutesAgo: minsSince(req?.created_at ?? s.opened_at),
      waiterName: staffOrder?.profiles?.full_name || 'QR Meja', openedAtTime: `${hhmm(s.opened_at)} WIB`,
      status: req ? 'minta_checkout' : 'belum_dibayar',
      isAllServed: true, // Bebas bayar tanpa harus menunggu status KDS
      unservedCount: unservedOrders.length,
      isTakeaway,
      takeawayQueue: s.takeaway_queue || (isTakeaway ? displayTableNumber : undefined),
      orderType: isTakeaway ? 'takeaway' : 'dine_in',
    } as BillItem];
  }).sort((a, b) => (a.status === b.status ? 0 : a.status === 'minta_checkout' ? -1 : 1)), [sessions, rawTables, requests, billOpts]);
  const selectedBill = bills.find((b) => b.id === selectedBillId) || bills[0];

  // Deteksi stasiun item: Dapur Utama (Makanan) vs Bar Minuman
  const isDrinkCategoryOrItem = (catName: string, prodName: string) => {
    const c = (catName || '').toLowerCase();
    const p = (prodName || '').toLowerCase();
    const drinkKeywords = ['minum', 'teh', 'kopi', 'wedang', 'jus', 'bar', 'beverage', 'drink', 'beverages'];
    const nameKeywords = [
      'es ', 'teh', 'kopi', 'sinom', 'jeruk', 'air mineral', 'degan', 'soda', 'kelapa', 'lemon',
      'kombucha', 'boba', 'matcha', 'latte', 'cappuccino', 'espresso', 'cola', 'susu', 'shake', 'mocktail'
    ];
    return drinkKeywords.some((k) => c.includes(k)) || nameKeywords.some((k) => p.includes(k));
  };

  const kitchenTickets: KitchenTicket[] = useMemo(() => sessions.flatMap((s) => {
    const t = rawTables.find((x) => x.table_id === s.table_id);
    const tableNumberStr = `Meja ${pad(t?.table_number ?? '?')}`;

    // Hanya tampilkan pesanan yang sudah resmi diverifikasi & dikonfirmasi ke dapur.
    // Dapur HANYA boleh memproses pesanan dengan status 'submitted', 'preparing', 'ready', atau 'served'.
    // Pesanan 'pending_confirmation' atau 'pending' (QR mandiri belum diverifikasi) WAJIB ditahan sampai kasir klik 'Terima'.
    const validOrders = (s.orders || []).filter((o: any) =>
      ['submitted', 'preparing', 'ready', 'served'].includes(o.order_status)
    );

    return validOrders.flatMap((o: any): KitchenTicket[] => {
      const elapsed = Math.max(0, Math.floor((now - new Date(o.created_at).getTime()) / 1000));
      const status = ORDER_TO_TICKET[o.order_status] || 'new';
      const waiter = o.profiles?.full_name || (o.order_source === 'qr' ? 'QR Meja' : 'Staf');
      const isTakeaway = Boolean(s.is_takeaway) || o.note?.includes('[BAWA PULANG]') || o.note?.includes('[TAKEAWAY]') || Boolean(t?.area && t.area.toLowerCase().includes('takeaway'));
      const ticketType: 'Santap di Tempat' | 'Bawa Pulang' = isTakeaway ? 'Bawa Pulang' : 'Santap di Tempat';
      const ticketTableNumber = isTakeaway ? (s.takeaway_queue || (t ? `Antrean ${pad(t.table_number)}` : 'Antrean 01')) : tableNumberStr;
      const cleanOrderNumber = String(o.order_number || '').replace(/^#+/, '');
      const rawNote = (o.note || '').replace(/\[BAWA PULANG[^\]]*\]/gi, '').replace(/\[TAKEAWAY[^\]]*\]/gi, '').trim();
      const cleanUserNote = rawNote.replace(/^Catatan:\s*/i, '').trim();
      const notesBanner = cleanUserNote.length > 0 ? cleanUserNote : undefined;
      const orderTimeStr = o.created_at ? `${hhmmColon(o.created_at)} WIB` : undefined;

      const allItems = (o.order_items || []).map((i: any) => ({
        name: i.product_name,
        quantity: i.quantity,
        notes: i.note || undefined,
        isDrink: isDrinkCategoryOrItem(productCategory.get(i.product_id) || '', i.product_name),
      }));

      const rawCustName = (s.customer_name || '').trim();
      const isGenericName = !rawCustName ||
        rawCustName.toLowerCase() === 'tamu' ||
        rawCustName.toLowerCase() === 'pelanggan bungkus' ||
        rawCustName.toLowerCase().includes('tamu (bawa pulang)') ||
        rawCustName.toLowerCase().includes('pelanggan');
      const ticketCustName = isGenericName ? undefined : rawCustName;

      return [{
        id: String(o.order_id),
        orderId: o.order_id,
        ticketNumber: cleanOrderNumber,
        tableNumber: ticketTableNumber,
        type: ticketType,
        waiterName: waiter,
        elapsedSeconds: elapsed,
        status,
        station: 'Semua Bagian',
        isPriority: false,
        totalItems: allItems.reduce((a: number, i: any) => a + i.quantity, 0),
        totalAmount: Number(o.total),
        readySecondsAgo: o.ready_at ? Math.max(0, Math.floor((now - new Date(o.ready_at).getTime()) / 1000)) : undefined,
        notesBanner,
        customerName: ticketCustName,
        takeawayQueue: s.takeaway_queue,
        orderTime: orderTimeStr,
        items: allItems,
      }];
    });
  }).sort((a, b) => b.elapsedSeconds - a.elapsedSeconds), [sessions, rawTables, productCategory, now]);

  const transactions: TransactionRecord[] = useMemo(() => payments.map((p) => {
    const total = Number(p.amount);
    // Satu pembayaran = satu sesi meja: SEMUA order di sesi itu ikut dibayar.
    // Jadi struk dibangun dari seluruh order sesi, bukan hanya order yang
    // menempel di baris payments (order_id).
    const sessionOrders: any[] = p.orders?.table_sessions?.orders ?? [];
    const sourceOrders: any[] = sessionOrders.length ? sessionOrders : (p.orders ? [p.orders] : []);
    const orderItems: OrderItemSummary[] = sourceOrders.flatMap((o: any) =>
      (o.order_items || []).map((i: any) => ({
        name: i.product_name,
        quantity: i.quantity,
        price: Number(i.unit_price),
        notes: i.note || undefined,
      })),
    );
    const calcSubtotal = orderItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const subtotal = calcSubtotal > 0 ? calcSubtotal : subtotalOf(total, billOpts);
    // Biaya (layanan + pajak) = sisa pembayaran, lalu dibagi pakai tarif pajak
    // yang berlaku. Tidak lagi menebak "sisa = pajak".
    const { service: serviceFee, tax } = splitFees(total, subtotal, billOpts);
    const tableNum = pad(p.orders?.table_sessions?.tables?.table_number ?? '?');
    const custName = p.orders?.table_sessions?.customer_name || 'Pelanggan';
    const guestCount = p.orders?.table_sessions?.guest_count || 1;
    const waiter = p.orders?.profiles?.full_name || (p.orders?.order_source === 'qr' ? 'QR meja' : 'Kasir');
    const methodLabel = METHOD_FROM_DB[p.method] ?? 'Tunai';
    const isTakeaway = p.orders?.note?.includes('[BAWA PULANG]') || p.orders?.note?.includes('[TAKEAWAY]') || Boolean(p.orders?.table_sessions?.tables?.area && p.orders.table_sessions.tables.area.toLowerCase().includes('takeaway'));

    const billData: BillItem = {
      id: `paid-bill-${p.payment_id}`,
      sessionId: p.orders?.table_sessions?.session_id,
      billNumber: p.orders?.order_number || `B-${p.payment_id}`,
      tableNumber: tableNum,
      customerName: custName,
      guestCount,
      itemCount: orderItems.reduce((a, i) => a + i.quantity, 0) || 1,
      items: orderItems.length > 0 ? orderItems : [{ name: 'Menu Pesanan Restoran', quantity: 1, price: subtotal }],
      subtotal,
      serviceFee,
      tax,
      total,
      requestedAt: hhmmColon(p.paid_at),
      elapsedMinutesAgo: 0,
      waiterName: waiter,
      openedAtTime: `${hhmm(p.orders?.created_at || p.paid_at)} WIB`,
      status: 'lunas',
      paymentMethod: p.method === 'cash' ? 'tunai' : (p.method as any),
      cashTendered: Number(p.cash_received) || total,
      changeAmount: Number(p.change_amount) || 0,
      paidAtTime: `${new Date(p.paid_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${hhmmColon(p.paid_at)} WIB`,
      isTakeaway,
      orderType: isTakeaway ? 'takeaway' : 'dine_in',
    };

    return {
      id: `trx-${p.payment_id}`,
      code: `#${sourceOrders.map((o: any) => o.order_number).filter(Boolean).join(' + ') || p.transaction_code || p.payment_id}`,
      time: hhmmColon(p.paid_at),
      at: p.paid_at,
      typeMeja: isTakeaway ? 'Bawa Pulang (Take Away)' : `Meja ${tableNum}`,
      source: p.orders?.order_source === 'qr' ? 'QR meja' : 'Manual',
      method: methodLabel,
      subtotal,
      tax,
      total,
      status: 'Lunas',
      billData,
    } as TransactionRecord;
  }), [payments]);

  // recentReceipts murni 100% diturunkan dari transaksi pembayaran Supabase
  const recentReceipts: BillItem[] = useMemo(() => {
    const map = new Map<string, BillItem>();
    const dbReceipts: BillItem[] = transactions.map((t) => t.billData).filter(Boolean) as BillItem[];
    dbReceipts.forEach((r) => {
      const key = r.sessionId ? `sess-${r.sessionId}` : `bill-${r.billNumber}`;
      map.set(key, r);
    });
    // Utamakan inMemoryReceipts yang dicatat langsung saat kasir menyelesaikan checkout sesi aktif
    inMemoryReceipts.forEach((r) => {
      const key = r.sessionId ? `sess-${r.sessionId}` : `bill-${r.billNumber}`;
      map.set(key, r);
    });
    return Array.from(map.values()).slice(0, 50);
  }, [transactions, inMemoryReceipts]);

  const lowStockIngredients = rawIngredients.filter((i) => i.currentStock <= i.minimumStock);

  // nilai default pilihan meja setelah data masuk
  useEffect(() => {
    if (!tables.length) return;
    if (!tables.some((t) => t.number === selectedTableId)) setSelectedTableId(tables[0].number);
    if (!tables.some((t) => t.number === orderTableNumber)) setOrderTableNumber(tables[0].number);
  }, [tables]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- aksi: meja ----------
  const run = async (p: PromiseLike<{ error: any }>, ok?: string) => {
    const { error } = await p;
    if (error) { showToast(error.message, 'warning'); return false; }
    if (ok) showToast(ok, 'success');
    await refresh();
    return true;
  };
  const updateTable = async (t: TableItem, newStatus?: TableStatus): Promise<boolean> => {
    try {
      const num = parseInt(t.number, 10);
      if (t.dbId && !isNaN(num)) {
        const { error: tErr } = await supabase.from('tables').update({ table_number: num }).eq('table_id', t.dbId);
        if (tErr) {
          showToast('Gagal update nomor meja: ' + tErr.message, 'warning');
          return false;
        }
      }

      const targetStatus = newStatus || t.status;
      if (t.dbId) {
        if (targetStatus === 'kosong') {
          // Tutup sesi aktif jika ada
          const { error: sErr } = await supabase
            .from('table_sessions')
            .update({ closed_at: new Date().toISOString() })
            .eq('table_id', t.dbId)
            .is('closed_at', null);
          if (sErr) {
            showToast('Gagal mengubah status meja: ' + sErr.message, 'warning');
            return false;
          }
        } else if (targetStatus === 'terisi') {
          // Cek apakah sudah ada sesi aktif
          const { data: existing } = await supabase
            .from('table_sessions')
            .select('session_id')
            .eq('table_id', t.dbId)
            .is('closed_at', null)
            .maybeSingle();

          if (!existing) {
            const { error: insErr } = await supabase
              .from('table_sessions')
              .insert({
                table_id: t.dbId,
                guest_count: 1,
                customer_name: 'Pelanggan',
                is_takeaway: false,
              });
            if (insErr) {
              showToast('Gagal membuat sesi aktif: ' + insErr.message, 'warning');
              return false;
            }
          }
        }
      }

      await refresh();
      showToast(`Pengaturan Meja ${t.number} berhasil diperbarui`, 'success');
      return true;
    } catch (err: any) {
      showToast('Error update meja: ' + (err?.message || 'Unknown error'), 'warning');
      return false;
    }
  };
  const addTable = async (tableNumber: number, _capacity?: number, _area?: string) => {
    return await run(
      supabase.from('tables').insert({ table_number: tableNumber, is_active: true }),
      `Meja ${tableNumber} berhasil ditambahkan`
    );
  };
  const deleteTable = async (tableId: number) => {
    return await run(
      supabase.from('tables').delete().eq('table_id', tableId),
      'Meja berhasil dihapus'
    );
  };
  const clearTableSession = async (tableNumberOrSessionId: string | number) => {
    const target = tables.find((t) => t.number === String(tableNumberOrSessionId) || t.sessionId === Number(tableNumberOrSessionId));
    const targetSessionId = target?.sessionId || (typeof tableNumberOrSessionId === 'number' ? tableNumberOrSessionId : undefined);
    if (targetSessionId) {
      try {
        await supabase.from('table_sessions').update({ closed_at: new Date().toISOString() }).eq('session_id', targetSessionId);
      } catch {}
      setSessions((prev) => prev.filter((s) => s.session_id !== targetSessionId));
    }
    showToast(`Meja ${target?.number || tableNumberOrSessionId} berhasil dikosongkan`, 'success');
  };

  const voidTableOrder = async (tableNumberOrSessionId: string | number, reason = 'Dibatalkan oleh kasir') => {
    const target = tables.find((t) => t.number === String(tableNumberOrSessionId) || t.sessionId === Number(tableNumberOrSessionId));
    const targetSessionId = target?.sessionId || (typeof tableNumberOrSessionId === 'number' ? tableNumberOrSessionId : undefined);

    if (targetSessionId) {
      try {
        await supabase.from('table_sessions').update({ closed_at: new Date().toISOString() }).eq('session_id', targetSessionId);
      } catch {}
      setSessions((prev) => prev.filter((s) => s.session_id !== targetSessionId));
    }

    showToast(`Pesanan Meja ${target?.number || tableNumberOrSessionId} berhasil dibatalkan`, 'success');
  };

  const voidOrderItem = async (
    tableNumberOrSessionId: string | number,
    item: OrderItemSummary,
    reason = 'Salah input kasir',
    qtyToVoid?: number
  ) => {
    const target = tables.find((t) => t.number === String(tableNumberOrSessionId) || t.sessionId === Number(tableNumberOrSessionId));
    const targetSessionId = target?.sessionId || (typeof tableNumberOrSessionId === 'number' ? tableNumberOrSessionId : undefined);

    if (!targetSessionId) {
      showToast('Sesi meja tidak ditemukan', 'warning');
      return;
    }

    const cancelQty = Math.max(1, Math.min(item.quantity, qtyToVoid ?? item.quantity));

    // 1. Optimistic update di local sessions
    setSessions((prev) => {
      return prev.map((s) => {
        if (s.session_id !== targetSessionId) return s;

        let itemHandled = false;
        const updatedOrders = (s.orders || []).map((o: any) => {
          if (itemHandled) return o;
          const items = o.order_items || [];
          const matchIndex = items.findIndex((it: any) => it.product_name === item.name);
          if (matchIndex === -1) return o;

          itemHandled = true;
          const targetIt = items[matchIndex];
          const remainingQty = targetIt.quantity - cancelQty;

          if (remainingQty > 0) {
            const newItems = [...items];
            newItems[matchIndex] = { ...targetIt, quantity: remainingQty };
            return { ...o, order_items: newItems, total: Math.max(0, (o.total || 0) - Number(targetIt.unit_price) * cancelQty) };
          } else {
            const newItems = items.filter((_: any, idx: number) => idx !== matchIndex);
            const deduct = Number(targetIt.unit_price) * (targetIt.quantity || 1);
            return { ...o, order_items: newItems, total: Math.max(0, (o.total || 0) - deduct) };
          }
        }).filter((o: any) => (o.order_items || []).length > 0);

        return { ...s, orders: updatedOrders };
      }).filter((s) => (s.orders || []).length > 0);
    });

    // 2. Supabase sync jika ada item_id
    try {
      if (item.orderItemId) {
        const remainingQty = item.quantity - cancelQty;
        if (remainingQty > 0) {
          await supabase.from('order_items').update({ quantity: remainingQty }).eq('order_item_id', item.orderItemId);
        } else {
          await supabase.from('order_items').delete().eq('order_item_id', item.orderItemId);
        }
      }
      await refreshDynamic();
    } catch {}

    const actionDesc = cancelQty >= item.quantity ? `Semua (${item.quantity}×) ${item.name} berhasil dibatalkan` : `${cancelQty}× ${item.name} berhasil dihapus`;
    showToast(actionDesc, 'info');
  };

  // ---------- aksi: keranjang & pesanan staf ----------
  const addToCart = (item: MenuItem, qty = 1, notes = '') => {
    setCartItems((prev) => {
      const i = prev.findIndex((c) => c.menuItem.id === item.id);
      if (i >= 0) return prev.map((c, k) => (k === i ? { ...c, quantity: c.quantity + qty, notes: notes || c.notes } : c));
      return [...prev, { menuItem: item, quantity: qty, notes }];
    });
    showToast(`${item.name} ditambahkan`);
  };
  const removeFromCart = (id: string) => setCartItems((p) => p.filter((c) => c.menuItem.id !== id));
  const updateCartQuantity = (id: string, d: number) =>
    setCartItems((p) => p.map((c) => (c.menuItem.id === id ? { ...c, quantity: c.quantity + d } : c)).filter((c) => c.quantity > 0));
  const updateCartItemNotes = (id: string, notes: string) => {
    setCartItems((p) => p.map((c) => (c.menuItem.id === id ? { ...c, notes } : c)));
    showToast('Catatan menu diperbarui');
  };
  const clearCart = () => setCartItems([]);

  const submitStaffOrder = async (draft: boolean): Promise<boolean> => {
    if (!cartItems.length) { showToast('Keranjang pesanan masih kosong', 'warning'); return false; }

    const isTakeaway = orderType === 'takeaway' ||
      kitchenGeneralNote.toLowerCase().includes('bungkus') ||
      kitchenGeneralNote.toLowerCase().includes('takeaway') ||
      kitchenGeneralNote.includes('[BAWA PULANG]');

    const tbl = tables.find((t) => t.number === orderTableNumber);
    if (!isTakeaway && !tbl) {
      showToast('Pilih meja terlebih dahulu untuk santap di tempat', 'warning');
      return false;
    }

    const { total } = bill(
      cartItems.reduce((acc, c) => acc + c.menuItem.price * c.quantity, 0),
      billOpts,
    );

    const queueLabel = takeawayNextQueue;
    const targetCustomerName = orderCustomerName.trim() || (isTakeaway ? 'Pelanggan Bungkus' : 'Tamu');
    const formattedTableLabel = isTakeaway
      ? queueLabel
      : (orderSecondaryTables.length > 0 ? `${orderTableNumber} (+ Meja ${orderSecondaryTables.join(', ')})` : orderTableNumber);

    const finalKitchenNote = kitchenGeneralNote.trim();

    // 1. Dapatkan atau buat sesi aktif di database Supabase
    let activeSessionId: number | null = null;

    if (isTakeaway) {
      // Meja Takeaway di Supabase adalah table_id 14 (table_number 0)
      const takeawayTable = rawTables.find((t) => t.table_number === 0 || t.area?.toLowerCase().includes('takeaway'));
      const takeawayTableId = takeawayTable ? takeawayTable.table_id : 14;

      const { data: newSess, error: sessErr } = await supabase
        .from('table_sessions')
        .insert({
          table_id: takeawayTableId,
          guest_count: 1,
          customer_name: targetCustomerName,
          is_takeaway: true,
          takeaway_queue: queueLabel,
        })
        .select('session_id')
        .single();

      if (sessErr || !newSess) {
        showToast('Gagal membuat sesi pesanan di Supabase: ' + (sessErr?.message || 'Error'), 'warning');
        return false;
      }
      activeSessionId = newSess.session_id;
    } else if (tbl?.dbId) {
      // Cari sesi terbuka di meja ini
      const { data: openSess } = await supabase
        .from('table_sessions')
        .select('session_id')
        .eq('table_id', tbl.dbId)
        .is('closed_at', null)
        .maybeSingle();

      if (openSess) {
        activeSessionId = openSess.session_id;
        if (targetCustomerName) {
          await supabase.from('table_sessions').update({ customer_name: targetCustomerName }).eq('session_id', openSess.session_id);
        }
      } else {
        const { data: newSess, error: sessErr } = await supabase
          .from('table_sessions')
          .insert({
            table_id: tbl.dbId,
            guest_count: orderGuestCount || 1,
            customer_name: targetCustomerName,
            is_takeaway: false,
          })
          .select('session_id')
          .single();

        if (sessErr || !newSess) {
          showToast('Gagal membuat sesi meja di Supabase: ' + (sessErr?.message || 'Error'), 'warning');
          return false;
        }
        activeSessionId = newSess.session_id;
      }
    }

    if (!activeSessionId) {
      showToast('Gagal memvalidasi sesi meja di database', 'warning');
      return false;
    }

    // 2. Buat Order di tabel `orders` Supabase (order_source: 'staff')
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateCode = `${yy}${mm}${dd}`;
    const seq = String(activeSessionId).slice(-3).padStart(3, '0');
    const baseOrderNumber = isTakeaway ? `TA-${dateCode}-${seq}` : `DIN-${dateCode}-${seq}`;

    // Cek jumlah pesanan yang sudah ada di sesi ini untuk penomoran pesan tambahan unik
    const { count: existingOrdersCount } = await supabase
      .from('orders')
      .select('order_id', { count: 'exact', head: true })
      .eq('session_id', activeSessionId);

    let orderNumber = baseOrderNumber;
    if (existingOrdersCount && existingOrdersCount > 0) {
      orderNumber = `${baseOrderNumber}-${existingOrdersCount + 1}`;
    }

    const { data: duplicateCheck } = await supabase
      .from('orders')
      .select('order_id')
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (duplicateCheck) {
      const randSuffix = Math.floor(10 + Math.random() * 90);
      orderNumber = `${orderNumber}-${randSuffix}`;
    }

    const { data: createdOrder, error: ordErr } = await supabase
      .from('orders')
      .insert({
        session_id: activeSessionId,
        order_number: orderNumber,
        order_source: 'staff',
        order_status: draft ? 'draft' : 'submitted',
        total,
        note: finalKitchenNote || (isTakeaway ? '[BAWA PULANG]' : null),
        created_by: currentUser?.id && currentUser.id.length === 36 ? currentUser.id : null,
      })
      .select('order_id, order_number')
      .single();

    if (ordErr || !createdOrder) {
      showToast('Gagal menyimpan pesanan di Supabase: ' + (ordErr?.message || 'Error'), 'warning');
      return false;
    }

    // 3. Masukkan item pesanan ke tabel `order_items` Supabase
    const itemsPayload = cartItems.map((c) => ({
      order_id: createdOrder.order_id,
      product_id: c.menuItem.dbId || Number(c.menuItem.id),
      product_name: c.menuItem.name,
      unit_price: c.menuItem.price,
      quantity: c.quantity,
      note: c.notes || null,
    }));

    if (itemsPayload.length > 0) {
      const { error: itemsErr } = await supabase.from('order_items').insert(itemsPayload);
      if (itemsErr) {
        showToast('Gagal menyimpan rincian menu: ' + itemsErr.message, 'warning');
        return false;
      }
    }

    if (!draft) {
      setCartItems([]);
      setKitchenGeneralNote('');
      setOrderCustomerName('');
      setOrderSecondaryTables([]);
      setOrderType('dine_in');
    }

    showToast(
      draft
        ? `Draf pesanan ${isTakeaway ? queueLabel : `Meja ${formattedTableLabel}`} disimpan ke database`
        : `Pesanan ${isTakeaway ? queueLabel : `Meja ${formattedTableLabel}`} sukses tersimpan di database & terkirim ke Kitchen!`,
      draft ? 'info' : 'success'
    );

    await refreshDynamic();
    return true;
  };
  const sendOrderToKitchen = async () => submitStaffOrder(false);
  const saveDraftOrder = async () => submitStaffOrder(true);

  // ---------- aksi: pembayaran ----------
  const settlePayment = async (
    billId: string,
    method: PayMethod | 'Split Payment',
    amountTendered?: number,
    splitDetail?: SplitPaymentDetail
  ) => {
    const target = bills.find((b) => b.id === billId);
    if (!target) return;

    const tendered = amountTendered || target.total;
    const change = Math.max(0, tendered - target.total);

    // Cari order_id yang valid dari database untuk sesi ini
    const sessObj = sessions.find((s) => s.session_id === target.sessionId);
    const validOrder = sessObj?.orders?.find((o: any) => o.order_status !== 'draft') || sessObj?.orders?.[0];

    // 1. Simpan Pembayaran Langsung ke Tabel `payments` Supabase
    if (validOrder) {
      const nowIso = new Date().toISOString();
      const dbMethod = METHOD_TO_DB[method as PayMethod] || 'cash';
      const yy = String(new Date().getFullYear()).slice(-2);
      const mm = String(new Date().getMonth() + 1).padStart(2, '0');
      const dd = String(new Date().getDate()).padStart(2, '0');
      const seq = String(validOrder.order_id).slice(-4).padStart(4, '0');
      const trxCode = `TRX-${yy}${mm}${dd}-${seq}`;

      const { error: payErr } = await supabase.from('payments').insert({
        transaction_code: trxCode,
        order_id: validOrder.order_id,
        method: dbMethod,
        amount: target.total,
        cash_received: tendered,
        change_amount: change,
        status: 'paid',
        paid_at: nowIso,
        confirmed_by: currentUser?.id && currentUser.id.length === 36 ? currentUser.id : null,
      });
      if (payErr) {
        showToast('Gagal mencatat pembayaran di database: ' + payErr.message, 'warning');
        return;
      }
    }

    // 2. Tandai pesanan sebagai served dan tutup sesi di database
    if (target.sessionId) {
      await Promise.all([
        supabase
          .from('orders')
          .update({ order_status: 'served', served_at: new Date().toISOString() })
          .eq('session_id', target.sessionId),
        supabase
          .from('table_sessions')
          .update({ closed_at: new Date().toISOString() })
          .eq('session_id', target.sessionId),
      ]);
    }

    // Hitung porsi tunai untuk update laci kasir
    let cashAdded = 0;
    if (method === 'Tunai') {
      cashAdded = target.total;
    } else if (method === 'Split Payment' && splitDetail) {
      if (splitDetail.method1 === 'Tunai') cashAdded += splitDetail.amount1;
      if (splitDetail.method2 === 'Tunai') cashAdded += splitDetail.amount2;
    }

    if (cashAdded > 0) {
      setCashierShift((prev) => {
        const newKasMasuk = prev.kasMasuk + cashAdded;
        const updated = {
          ...prev,
          kasMasuk: newKasMasuk,
          totalLaci: prev.modalAwal + newKasMasuk,
        };
        try {
          localStorage.setItem('rg_pos_cashier_shift', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }

    const paidBill: BillItem = {
      ...target,
      status: 'lunas',
      isAllServed: true,
      unservedCount: 0,
      paymentMethod: method === 'Split Payment' ? 'split' : method === 'Tunai' ? 'tunai' : method === 'QRIS' ? 'qris' : 'debit',
      splitDetail,
      cashTendered: tendered,
      changeAmount: change,
      paidAtTime: `${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace('.', ':')} WIB`,
    };

    saveRecentReceipt(paidBill);
    setReceiptModalData(paidBill);
    setSelectedBillId('');

    // Segarkan data dari Supabase
    await refreshDynamic();

    showToast(`Pembayaran ${target.isTakeaway ? target.tableNumber : `Meja ${target.tableNumber}`} LUNAS via ${method}!`, 'success');
  };

  // ---------- aksi: dapur ----------

  const advanceTicketStatus = async (ticketId: string) => {
    const rawOrderId = Number(ticketId.replace('-food', '').replace('-drink', ''));
    if (!rawOrderId) return;

    try {
      const { data: curOrd } = await supabase
        .from('orders')
        .select('order_status')
        .eq('order_id', rawOrderId)
        .single();

      const cur = curOrd?.order_status || 'submitted';
      const nextStatus =
        cur === 'submitted' ? 'preparing' :
        cur === 'preparing' ? 'ready' :
        'served';

      const { error } = await supabase
        .from('orders')
        .update({
          order_status: nextStatus,
          ready_at: nextStatus === 'ready' ? new Date().toISOString() : undefined,
          served_at: nextStatus === 'served' ? new Date().toISOString() : undefined,
        })
        .eq('order_id', rawOrderId);

      if (error) {
        showToast('Gagal update status di database: ' + error.message, 'warning');
        return;
      }
      await refreshDynamic();
      showToast('Status pesanan diperbarui');
    } catch (e) {
      showToast('Koneksi bermasalah, coba lagi', 'warning');
    }
  };

  const completeKitchenTicket = async (ticketId: string) => {
    const rawOrderId = Number(ticketId.replace('-food', '').replace('-drink', ''));
    if (!rawOrderId) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          order_status: 'served',
          ready_at: new Date().toISOString(),
          served_at: new Date().toISOString(),
        })
        .eq('order_id', rawOrderId);

      if (error) {
        showToast('Gagal update status di database: ' + error.message, 'warning');
        return;
      }
      await refreshDynamic();
      showToast('Pesanan selesai disiapkan', 'success');
    } catch (e) {
      showToast('Koneksi bermasalah, coba lagi', 'warning');
    }
  };

  // ---------- aksi: menu ----------
  const categoryId = async (name: string) => {
    const found = categories.find((c) => c.name === name);
    if (found) return found.category_id as number;
    const { data } = await supabase.from('categories').insert({ name }).select('category_id').single();
    return data?.category_id as number;
  };
  const productPayload = async (i: MenuItem) => {
    const isFav = Boolean(i.isFavorite || i.isRecommended);
    return {
      name: i.name,
      price: i.price,
      description: i.description || null,
      is_available: i.isAvailable,
      is_favorite: isFav,
      is_recommended: isFav,
      category_id: await categoryId(i.category),
      image_url: i.image && !isPlaceholder(i.image) ? i.image : null,
    };
  };
  const updateMenuItem = async (item: MenuItem) => {
    await run(supabase.from('products').update({ ...(await productPayload(item)), updated_at: new Date().toISOString() }).eq('product_id', item.dbId),
      `Menu ${item.name} diperbarui`);
  };
  const addMenuItem = async (item: MenuItem) => {
    const code = item.code && !/^RG-\d+$/.test(item.code) ? item.code : 'P' + Date.now().toString().slice(-6);
    await run(supabase.from('products').insert({ ...(await productPayload(item)), product_code: code }), `Menu baru ${item.name} berhasil ditambahkan!`);
  };
  const toggleMenuItemAvailability = async (itemId: number | string) => {
    const idNum = Number(itemId);
    const target = products.find((p) => p.product_id === idNum || String(p.product_id) === String(itemId));
    if (!target) return;
    const newStatus = !target.is_available;

    setProducts((prev) => prev.map((p) => (p.product_id === target.product_id ? { ...p, is_available: newStatus } : p)));

    try {
      await supabase.from('products').update({ is_available: newStatus, updated_at: new Date().toISOString() }).eq('product_id', target.product_id);
    } catch (e) {
      console.warn('Failed to update product availability in remote DB', e);
    }

    showToast(`Menu ${target.name} ditandai ${newStatus ? 'Tersedia' : 'Habis (Out of Stock)'}`, 'info');
  };
  const deleteMenuItem = async (itemId: number | string) => {
    return await run(supabase.from('products').delete().eq('product_id', Number(itemId)), 'Menu berhasil dihapus');
  };

  // ---------- aksi: bahan baku ----------
  const ingUpdate = (id: string, patch: any, ok?: string) => run(supabase.from('ingredients').update(patch).eq('ingredient_id', Number(id)), ok);
  const updateIngredientStock = (id: string, n: number) => { ingUpdate(id, { current_stock: Math.max(0, n), last_restocked: new Date().toISOString() }); };
  const restockIngredient = (id: string, add: number) => {
    const cur = rawIngredients.find((i) => i.id === id)?.currentStock ?? 0;
    ingUpdate(id, { current_stock: Math.round((cur + add) * 100) / 100, last_restocked: new Date().toISOString() }, `Restok ${add} unit berhasil ditambahkan!`);
  };
  const updateIngredientMinimum = (id: string, n: number) => { ingUpdate(id, { minimum_stock: Math.max(0, n) }, 'Batas minimum stok diperbarui'); };
  const addRawIngredient = (i: RawIngredient) => {
    run(supabase.from('ingredients').insert({
      code: 'BHN-' + Date.now().toString().slice(-6), name: i.name, category: i.category, current_stock: i.currentStock,
      minimum_stock: i.minimumStock, unit: i.unit, cost_per_unit: i.costPerUnit, supplier: i.supplier, linked_menu_items: i.linkedMenuItems,
    }), `Bahan baku ${i.name} berhasil ditambahkan!`);
  };
  const deleteRawIngredient = async (ingredientId: number | string) => {
    return await run(supabase.from('ingredients').delete().eq('ingredient_id', Number(ingredientId)), 'Bahan baku berhasil dihapus');
  };

  return (
    <AppContext.Provider value={{
      currentUser, currentRole, setCurrentRole, updateCurrentUserName, isLoggedIn, authLoading, dataReady, login, logout,
      activeView, setActiveView, viewportMode, setViewportMode, outletName, setOutletName,
      tables, selectedTableId, setSelectedTableId, updateTable, addTable, deleteTable, clearTableSession, voidOrderItem, voidTableOrder,
      cartItems, orderType, setOrderType, takeawayNextQueue, orderTableNumber, setOrderTableNumber, orderSecondaryTables, setOrderSecondaryTables,
      orderCustomerName, setOrderCustomerName, orderGuestCount, setOrderGuestCount,
      kitchenGeneralNote, setKitchenGeneralNote, addToCart, removeFromCart, updateCartQuantity, updateCartItemNotes, clearCart,
      sendOrderToKitchen, saveDraftOrder,
      bills, selectedBillId, setSelectedBillId, selectedBill, settlePayment,
      menuItems, menuCategories, updateMenuItem, addMenuItem, deleteMenuItem, toggleMenuItemAvailability,
      rawIngredients, lowStockIngredients, updateIngredientStock, restockIngredient, updateIngredientMinimum, addRawIngredient, deleteRawIngredient,
      dismissStockWarning, setDismissStockWarning,
      kitchenTickets, advanceTicketStatus, completeKitchenTicket, transactions, recentReceipts,
      toast, showToast, receiptModalData, openReceiptModal: setReceiptModalData, closeReceiptModal: () => setReceiptModalData(null),
      desktopSidebarOpen, setDesktopSidebarOpen, toggleDesktopSidebar,
      storeSettings, updateStoreSettings,
      cashierShift, openCashierShift, closeCashierShift,
      playDingSound,
      refresh, isOnline,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
