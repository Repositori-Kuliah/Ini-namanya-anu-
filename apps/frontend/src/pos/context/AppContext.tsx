import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  UserRole, StaffUser, TableItem, TableStatus, MenuItem, CartItem, BillItem,
  TransactionRecord, KitchenTicket, RawIngredient, OrderItemSummary,
} from '../types';
import { supabase, tableUrl } from '../../lib/supabase';
import { billOfOrders, itemsSubtotal, today } from '../../lib/domain';
import { placeholderImage, isPlaceholder } from '../../lib/placeholder';
import { INITIAL_TABLES, INITIAL_INGREDIENTS, INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../../lib/mockData';

export type AppView =
  | 'login' | 'meja-dan-pelanggan' | 'pesanan-baru' | 'checkout' | 'pembayaran'
  | 'pantau-pesanan' | 'dashboard' | 'kelola-menu' | 'kelola-meja' | 'akun-staf-dan-role' | 'laporan';

interface ToastNotification { id: string; message: string; type?: 'success' | 'info' | 'warning'; }
type PayMethod = 'Tunai' | 'QRIS' | 'Kartu Debit';

interface AppContextType {
  currentUser: StaffUser;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
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
  updateTable: (table: TableItem) => void;
  addTable: (tableNumber: number, capacity: number, area: string) => Promise<boolean>;

  cartItems: CartItem[];
  orderTableNumber: string;
  setOrderTableNumber: (tableNumber: string) => void;
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
  sendOrderToKitchen: () => void;
  saveDraftOrder: () => void;

  bills: BillItem[];
  selectedBillId: string;
  setSelectedBillId: (id: string) => void;
  selectedBill: BillItem | undefined;
  settlePayment: (billId: string, method: PayMethod, amountTendered?: number) => void;

  menuItems: MenuItem[];
  menuCategories: string[];
  updateMenuItem: (item: MenuItem) => void;
  addMenuItem: (item: MenuItem) => void;

  rawIngredients: RawIngredient[];
  lowStockIngredients: RawIngredient[];
  updateIngredientStock: (id: string, newStock: number) => void;
  restockIngredient: (id: string, addedStock: number) => void;
  updateIngredientMinimum: (id: string, newMin: number) => void;
  addRawIngredient: (ingredient: RawIngredient) => void;
  dismissStockWarning: boolean;
  setDismissStockWarning: (dismissed: boolean) => void;

  deleteTable: (tableId: number) => Promise<boolean>;
  deleteMenuItem: (itemId: number | string) => Promise<boolean>;
  deleteRawIngredient: (ingredientId: number | string) => Promise<boolean>;
  refresh: () => Promise<void>;
  isOnline: boolean;

  kitchenTickets: KitchenTicket[];
  advanceTicketStatus: (ticketId: string) => void;

  transactions: TransactionRecord[];
  recentReceipts: BillItem[];

  toast: ToastNotification | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
  receiptModalData: BillItem | null;
  openReceiptModal: (bill: BillItem) => void;
  closeReceiptModal: () => void;
  qrModalTable: TableItem | null;
  openQrModal: (table: TableItem) => void;
  closeQrModal: () => void;

  desktopSidebarOpen: boolean;
  setDesktopSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleDesktopSidebar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ---------- helper tampilan ----------
const pad = (n: number | string) => String(n).padStart(2, '0');
const WIB = 'Asia/Jakarta';
const hhmm = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: WIB }).replace(':', '.') : '-');
const hhmmColon = (iso: string) => hhmm(iso).replace('.', ':');
const minsSince = (iso?: string | null) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000)) : 0);
const idDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: WIB }) : '-');
const rp = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

const ROLE_FROM_DB: Record<string, UserRole> = { admin: 'admin', staff: 'kasir', cashier: 'kasir', kitchen: 'kitchen' };
const ROLE_TO_DB: Record<string, string> = { admin: 'admin', kasir: 'staff', kitchen: 'kitchen' };
const METHOD_TO_DB: Record<PayMethod, string> = { Tunai: 'cash', QRIS: 'qris', 'Kartu Debit': 'debit' };
const METHOD_FROM_DB: Record<string, TransactionRecord['method']> = { cash: 'Tunai', qris: 'QRIS', debit: 'Kartu Debit' };
const BAR_CATEGORIES = ['Teh', 'Kopi', 'Wedang', 'Lainnya'];

const STATUS_LABEL: Record<TableStatus, string> = {
  kosong: 'Kosong', terisi: 'Disajikan', checkout: 'Minta Checkout', diproses: 'Diproses',
  siap_diantar: 'Siap Diantar', draf: 'Draf Pesanan', terkirim: 'Terkirim',
};
const ORDER_TO_TABLE: Record<string, TableStatus> = { submitted: 'terkirim', preparing: 'diproses', ready: 'siap_diantar', served: 'terisi' };
const ORDER_TO_TICKET: Record<string, KitchenTicket['status']> = { submitted: 'new', preparing: 'preparing', ready: 'ready', served: 'served' };

const GUEST_USER: StaffUser = { id: '', name: '', email: '', role: 'kasir', avatar: '', shift: '', terminal: '' };
const toStaffUser = (p: any, email: string): StaffUser => ({
  id: p.id, name: p.full_name, email: p.email || email, role: ROLE_FROM_DB[p.role] ?? 'kasir',
  avatar: '', shift: p.shift || '', terminal: p.terminal || '',
});
const homeView = (r: UserRole): AppView => (r === 'kitchen' ? 'pantau-pesanan' : r === 'admin' ? 'dashboard' : 'meja-dan-pelanggan');

const MASTER_CACHE_KEY = 'rg_pos_master_cache_v2';
const readMasterCache = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(MASTER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

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

  const masterCache = readMasterCache();
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // data dari database (dengan fallback awal ke cache offline lokal)
  const [rawTables, setRawTables] = useState<any[]>(() => masterCache?.tables || []);
  const [sessions, setSessions] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>(() => (masterCache?.products?.length ? masterCache.products : INITIAL_PRODUCTS));
  const [categories, setCategories] = useState<any[]>(() => (masterCache?.categories?.length ? masterCache.categories : INITIAL_CATEGORIES));
  const [rawIngredients, setRawIngredients] = useState<RawIngredient[]>(() => masterCache?.ingredients || []);
  const [payments, setPayments] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());

  // state UI
  const [selectedTableId, setSelectedTableId] = useState('');
  const [orderTableNumber, setOrderTableNumber] = useState('');
  const [orderCustomerName, setOrderCustomerName] = useState('');
  const [orderGuestCount, setOrderGuestCount] = useState(2);
  const [kitchenGeneralNote, setKitchenGeneralNote] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedBillId, setSelectedBillId] = useState('');
  const [dismissStockWarning, setDismissStockWarning] = useState(false);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [receiptModalData, setReceiptModalData] = useState<BillItem | null>(null);
  const [qrModalTable, setQrModalTable] = useState<TableItem | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<BillItem[]>(() => {
    try {
      const saved = localStorage.getItem('rg_recent_receipts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveRecentReceipt = useCallback((receipt: BillItem) => {
    setRecentReceipts((prev) => {
      const filtered = prev.filter((r) => {
        if (r.sessionId && receipt.sessionId) return r.sessionId !== receipt.sessionId;
        return r.id !== receipt.id && r.billNumber !== receipt.billNumber;
      });
      const updated = [receipt, ...filtered].slice(0, 50);
      try {
        localStorage.setItem('rg_recent_receipts', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save receipt to localStorage', err);
      }
      return updated;
    });
  }, []);

  const rawTablesRef = useRef<any[]>([]);
  rawTablesRef.current = rawTables;
  const seenRequests = useRef<Set<number> | null>(null);
  const roleRef = useRef<UserRole>('kasir');
  const currentUserRef = useRef<StaffUser>(GUEST_USER);
  currentUserRef.current = currentUser;

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString() + Math.random();
    setToast({ id, message, type });
    setTimeout(() => setToast((c) => (c?.id === id ? null : c)), 2800);
  }, []);

  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // ---------- muat data katalog statis (hybrid offline-online) ----------
  const loadMasterData = useCallback(async () => {
    try {
      const [cats, prods, tbls, ings] = await Promise.all([
        supabase.from('categories').select('*').order('category_id'),
        supabase.from('products').select('*, categories(name)').order('product_id'),
        supabase.from('tables').select('*').eq('is_active', true).order('table_number'),
        supabase.from('ingredients').select('*').order('ingredient_id'),
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

      if (loadedCats.length) {
        setCategories(loadedCats);
      } else {
        setCategories((prev) => (prev.length ? prev : INITIAL_CATEGORIES));
      }
      if (loadedProds.length) {
        setProducts(loadedProds);
      } else {
        setProducts((prev) => (prev.length ? prev : INITIAL_PRODUCTS));
      }
      if (loadedTbls.length) {
        setRawTables(loadedTbls);
      } else {
        setRawTables((prev) => (prev.length ? prev : INITIAL_TABLES));
      }
      const initialMappedIngs: RawIngredient[] = INITIAL_INGREDIENTS.map((i: any) => ({
        id: String(i.ingredient_id), code: i.code, name: i.name, category: i.category,
        currentStock: Number(i.current_stock), minimumStock: Number(i.minimum_stock), unit: i.unit,
        costPerUnit: Number(i.cost_per_unit), supplier: i.supplier || '-',
        lastRestocked: idDate(i.last_restocked), linkedMenuItems: i.linked_menu_items || [],
      }));

      if (loadedIngs.length) {
        setRawIngredients(loadedIngs);
      } else {
        setRawIngredients((prev) => (prev.length ? prev : initialMappedIngs));
      }

      // Simpan ke cache offline lokal
      try {
        localStorage.setItem(MASTER_CACHE_KEY, JSON.stringify({
          categories: loadedCats.length ? loadedCats : (masterCache?.categories || []),
          products: loadedProds.length ? loadedProds : (masterCache?.products || []),
          tables: loadedTbls.length ? loadedTbls : (masterCache?.tables || []),
          ingredients: loadedIngs.length ? loadedIngs : (masterCache?.ingredients || []),
          cachedAt: Date.now(),
        }));
      } catch (err) {
        console.warn('[pos cache write error]', err);
      }
    } catch (e) {
      console.warn('[supabase master load fallback to cache]', e);
    }
  }, []);

  // ---------- muat data operasional dinamis ----------
  const refreshDynamic = useCallback(async () => {
    const role = roleRef.current;
    const canSeeMoney = role !== 'kitchen';
    try {
      const [ses, reqs, pays] = await Promise.all([
        supabase.from('table_sessions')
          .select('session_id,table_id,guest_count,customer_name,opened_at,orders(order_id,order_number,order_status,order_source,total,note,created_at,ready_at,served_at,profiles(full_name),order_items(order_item_id,product_id,product_name,unit_price,quantity,note))')
          .is('closed_at', null),
        supabase.from('service_requests').select('*').eq('status', 'pending'),
        canSeeMoney
          ? supabase.from('payments').select('payment_id,transaction_code,method,amount,cash_received,change_amount,paid_at,orders(order_id,order_number,order_source,total,created_at,profiles(full_name),table_sessions(session_id,customer_name,guest_count,tables(table_number)),order_items(order_item_id,product_name,unit_price,quantity,note))')
              .eq('status', 'paid').gte('paid_at', today() + 'T00:00:00+07:00').order('paid_at', { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);

      const reqData = reqs.data ?? [];
      const tblData = rawTablesRef.current;

      if (ses.data) setSessions(ses.data);
      if (reqs.data) setRequests(reqData);
      if (pays.data) setPayments(pays.data);

      // Notifikasi suara & toast jika ada permintaan meja baru
      const prev = seenRequests.current;
      if (prev && role !== 'kitchen') {
        const newReqs = reqData.filter((r: any) => !prev.has(r.request_id));
        if (newReqs.length > 0) {
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(659.25, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.2);
              gain.gain.setValueAtTime(0.25, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
              osc.start();
              osc.stop(ctx.currentTime + 0.5);
            }
          } catch {
            // Browser policy ignore
          }
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
  const loadProfile = async (uid: string, email: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).eq('is_active', true).maybeSingle();
    if (error || !data) return null;
    return ['admin', 'staff', 'kitchen', 'cashier'].includes(data.role) ? toStaffUser(data, email) : null;
  };
  const enter = (u: StaffUser, redirect = false) => {
    roleRef.current = u.role;
    currentUserRef.current = u;
    setCurrentUser(u);
    setCurrentRoleState(u.role);
    setIsLoggedIn(true);

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
      const u = s ? await loadProfile(s.user.id, s.user.email || '') : null;
      if (!alive) return;
      if (u) enter(u, false); else if (s) await supabase.auth.signOut();
      setAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!alive) return;
      if (event === 'SIGNED_IN' && session) {
        // Abaikan jika user yang sama sudah aktif masuk (mencegah reset rute saat tab browser berpindah/kembali fokus)
        if (currentUserRef.current?.id === session.user.id) {
          return;
        }
        const u = await loadProfile(session.user.id, session.user.email || '');
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

  const login = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        return error.message || 'Email atau kata sandi tidak cocok.';
      }
      if (data?.user) {
        const u = await loadProfile(data.user.id, data.user.email || cleanEmail);
        if (u) {
          enter(u, true);
          showToast(`Berhasil masuk sebagai ${u.role.toUpperCase()}`, 'success');
          return null;
        } else {
          await supabase.auth.signOut();
          return 'Akun Anda tidak memiliki hak akses operasional atau sedang dinonaktifkan.';
        }
      }
    } catch (err: any) {
      return err?.message || 'Terjadi kesalahan saat menghubungi server autentikasi.';
    }

    return 'Email atau kata sandi tidak cocok.';
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
      } catch {}
    }
    seenRequests.current = null;
    setSessions([]);
    setPayments([]);
    showToast('Sesi berakhir. Sampai jumpa!');
  };
  // hanya admin yang boleh "melihat sebagai" peran lain (pratinjau tampilan)
  const setCurrentRole = (r: UserRole) => { if (currentUser.role === 'admin') setCurrentRoleState(r); };

  // Status koneksi jaringan (Hybrid Offline / Online)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToastRef.current('Koneksi internet aktif. Menyinkronkan data...', 'info');
      refresh();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToastRef.current('Mode Offline aktif: Operasi menggunakan cache lokal.', 'warning');
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

  // Interval pembaruan menit diubah ke 30 detik (bukan setiap 1 detik) untuk efisiensi CPU & render
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // ---------- turunan: menu ----------
  const productCategory = useMemo(() => new Map(products.map((p) => [p.product_id, p.categories?.name as string])), [products]);
  const menuItems: MenuItem[] = useMemo(() => products.map((p) => ({
    id: String(p.product_id), dbId: p.product_id, code: p.product_code, name: p.name,
    category: p.categories?.name ?? '-', price: Number(p.price), description: p.description || '',
    image: p.image_url || placeholderImage(p.name), isAvailable: p.is_available,
    isFavorite: p.is_favorite, isSignature: p.is_signature, portionsSold: 0,
  })), [products]);
  const menuCategories = useMemo(() => categories.map((c) => c.name as string), [categories]);

  // ---------- turunan: meja, tagihan, tiket dapur ----------
  const tables: TableItem[] = useMemo(() => rawTables.map((t) => {
    const s = sessions.find((x) => x.table_id === t.table_id);
    const base: TableItem = {
      id: `tbl-${pad(t.table_number)}`, dbId: t.table_id, qrToken: t.qr_token, number: pad(t.table_number),
      capacity: 4, area: 'Ruang Restoran', status: 'kosong', statusLabel: STATUS_LABEL.kosong,
      qrCodeId: `RG-M${pad(t.table_number)}`, qrUrl: tableUrl(t.qr_token),
    };
    if (!s) return base;
    const live = (s.orders || []).filter((o: any) => o.order_status !== 'draft');
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
    else status = ORDER_TO_TABLE.served;
    const items: OrderItemSummary[] = shown.flatMap((o: any) => o.order_items.map((i: any) => ({
      name: i.product_name, quantity: i.quantity, price: i.unit_price * i.quantity, notes: i.note || undefined })));
    const totalRaw = shown.reduce((a: number, o: any) => a + Number(o.total), 0);
    return { ...base, status, statusLabel: STATUS_LABEL[status], name: s.customer_name || undefined, guestCount: s.guest_count,
      totalRaw, totalFormatted: rp(totalRaw), billId: `${status === 'draf' ? 'D' : 'B'}-${s.session_id}`, infoSubtitle: info, sessionId: s.session_id, items };
  }), [rawTables, sessions, requests, now]); // eslint-disable-line react-hooks/exhaustive-deps

  const bills: BillItem[] = useMemo(() => sessions.flatMap((s) => {
    const live = (s.orders || []).filter((o: any) => o.order_status !== 'draft');
    if (!live.length) return [];
    const t = rawTables.find((x) => x.table_id === s.table_id);
    const b = billOfOrders(live.map((o: any) => itemsSubtotal(o.order_items)));
    const req = requests.find((r) => r.table_id === s.table_id && r.kind === 'checkout');
    const items: OrderItemSummary[] = live.flatMap((o: any) => o.order_items.map((i: any) => ({
      name: i.product_name, quantity: i.quantity, price: Number(i.unit_price), notes: i.note || undefined })));
    const staffOrder = live.find((o: any) => o.profiles?.full_name);
    const unservedOrders = live.filter((o: any) => o.order_status !== 'served');
    const isAllServed = unservedOrders.length === 0;

    return [{
      id: `bill-${s.session_id}`, sessionId: s.session_id, billNumber: `B-${s.session_id}`, tableNumber: pad(t?.table_number ?? '?'),
      customerName: s.customer_name || 'Tamu', guestCount: s.guest_count, itemCount: items.reduce((a, i) => a + i.quantity, 0), items,
      subtotal: b.subtotal, serviceFee: b.service, tax: b.tax, total: b.total,
      requestedAt: req ? hhmmColon(req.created_at) : '-', elapsedMinutesAgo: minsSince(req?.created_at ?? s.opened_at),
      waiterName: staffOrder?.profiles?.full_name || 'QR Meja', openedAtTime: `${hhmm(s.opened_at)} WIB`,
      status: req ? 'minta_checkout' : 'belum_dibayar',
      isAllServed,
      unservedCount: unservedOrders.length,
    } as BillItem];
  }).sort((a, b) => (a.status === b.status ? 0 : a.status === 'minta_checkout' ? -1 : 1)), [sessions, rawTables, requests]);
  const selectedBill = bills.find((b) => b.id === selectedBillId) || bills[0];

  const kitchenTickets: KitchenTicket[] = useMemo(() => sessions.flatMap((s) => {
    const t = rawTables.find((x) => x.table_id === s.table_id);
    return (s.orders || []).filter((o: any) => o.order_status !== 'draft').map((o: any): KitchenTicket => {
      const cats = o.order_items.map((i: any) => productCategory.get(i.product_id) || '');
      const station = cats.length && cats.every((c: string) => BAR_CATEGORIES.includes(c)) ? 'Bar Minuman' : 'Dapur Utama (Makanan)';
      const elapsed = Math.max(0, Math.floor((now - new Date(o.created_at).getTime()) / 1000));
      const status = ORDER_TO_TICKET[o.order_status];
      const waiter = o.profiles?.full_name || (o.order_source === 'qr' ? 'QR Meja' : 'Staf');
      return {
        id: String(o.order_id), orderId: o.order_id, ticketNumber: `#${o.order_number}`, tableNumber: `Table ${pad(t?.table_number ?? '?')}`,
        type: 'Dine in', waiterName: waiter, elapsedSeconds: elapsed, status, station,
        isPriority: elapsed > 900 && (status === 'new' || status === 'preparing'),
        totalItems: o.order_items.reduce((a: number, i: any) => a + i.quantity, 0), totalAmount: Number(o.total),
        readySecondsAgo: o.ready_at ? Math.max(0, Math.floor((now - new Date(o.ready_at).getTime()) / 1000)) : undefined,
        notesBanner: o.note ? `Catatan: ${o.note}` : o.order_source === 'qr' ? 'Dipesan via QR meja' : `Dikirim oleh ${waiter}`,
        items: o.order_items.map((i: any) => ({ name: i.product_name, quantity: i.quantity, notes: i.note || undefined })),
      };
    });
  }).sort((a, b) => b.elapsedSeconds - a.elapsedSeconds), [sessions, rawTables, productCategory, now]);

  const transactions: TransactionRecord[] = useMemo(() => payments.map((p) => {
    const total = Number(p.amount);
    const subtotal = Math.round(total / 1.155);
    const tax = total - subtotal;
    const orderItems: OrderItemSummary[] = (p.orders?.order_items || []).map((i: any) => ({
      name: i.product_name,
      quantity: i.quantity,
      price: Number(i.unit_price),
      notes: i.note || undefined,
    }));
    const tableNum = pad(p.orders?.table_sessions?.tables?.table_number ?? '?');
    const custName = p.orders?.table_sessions?.customer_name || 'Pelanggan';
    const guestCount = p.orders?.table_sessions?.guest_count || 1;
    const waiter = p.orders?.profiles?.full_name || (p.orders?.order_source === 'qr' ? 'QR meja' : 'Kasir');
    const methodLabel = METHOD_FROM_DB[p.method] ?? 'Tunai';

    const billData: BillItem = {
      id: `paid-bill-${p.payment_id}`,
      sessionId: p.orders?.table_sessions?.session_id,
      billNumber: p.orders?.order_number || `B-${p.payment_id}`,
      tableNumber: tableNum,
      customerName: custName,
      guestCount,
      itemCount: orderItems.reduce((a, i) => a + i.quantity, 0) || 1,
      items: orderItems.length > 0 ? orderItems : [{ name: 'Menu Pesanan Restoran', quantity: 1, price: subtotal }],
      subtotal: orderItems.length > 0 ? orderItems.reduce((a, i) => a + (i.price * i.quantity), 0) : subtotal,
      serviceFee: Math.round(subtotal * 0.05),
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
    };

    return {
      id: `trx-${p.payment_id}`,
      code: `#${p.orders?.order_number || p.transaction_code || p.payment_id}`,
      time: hhmmColon(p.paid_at),
      at: p.paid_at,
      typeMeja: `Meja ${tableNum}`,
      source: p.orders?.order_source === 'qr' ? 'QR meja' : 'Manual',
      method: methodLabel,
      subtotal,
      tax,
      total,
      status: 'Lunas',
      billData,
    } as TransactionRecord;
  }), [payments]);

  // Sync payments from DB into recent receipts with deduplication
  useEffect(() => {
    if (!payments.length) return;
    const dbReceipts: BillItem[] = transactions.map((t) => t.billData).filter(Boolean) as BillItem[];
    setRecentReceipts((local) => {
      const map = new Map<string, BillItem>();
      local.forEach((r) => {
        const key = r.sessionId ? `sess-${r.sessionId}` : `bill-${r.billNumber}`;
        map.set(key, r);
      });
      dbReceipts.forEach((r) => {
        const key = r.sessionId ? `sess-${r.sessionId}` : `bill-${r.billNumber}`;
        if (!map.has(key)) {
          map.set(key, r);
        }
      });
      const combined = Array.from(map.values()).slice(0, 50);
      try {
        localStorage.setItem('rg_recent_receipts', JSON.stringify(combined));
      } catch {
        // ignore
      }
      return combined;
    });
  }, [payments, transactions]);

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
  const updateTable = async (t: TableItem) => {
    await run(
      supabase.from('tables').update({ table_number: parseInt(t.number, 10) }).eq('table_id', t.dbId),
      `Pengaturan Meja ${t.number} berhasil diperbarui`
    );
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

  const submitStaffOrder = async (draft: boolean) => {
    if (!cartItems.length) { showToast('Keranjang pesanan masih kosong', 'warning'); return; }
    const tbl = tables.find((t) => t.number === orderTableNumber);
    if (!tbl) { showToast('Pilih meja terlebih dahulu', 'warning'); return; }
    const { data, error } = await supabase.rpc('staff_place_order', {
      p_table_id: tbl.dbId, p_guests: orderGuestCount, p_customer: orderCustomerName, p_note: kitchenGeneralNote, p_draft: draft,
      p_items: cartItems.map((c) => ({ id: c.menuItem.dbId, qty: c.quantity, note: c.notes })),
    });
    if (error || data?.error) { showToast(error?.message || data.error, 'warning'); return; }
    if (!draft) setCartItems([]);
    showToast(draft ? `Draf pesanan Meja ${orderTableNumber} disimpan` : `Pesanan Meja ${orderTableNumber} sukses dikirim ke Kitchen!`, draft ? 'info' : 'success');
    await refresh();
  };
  const sendOrderToKitchen = () => { submitStaffOrder(false); };
  const saveDraftOrder = () => { submitStaffOrder(true); };

  // ---------- aksi: pembayaran ----------
  const settlePayment = async (billId: string, method: PayMethod, amountTendered?: number) => {
    const target = bills.find((b) => b.id === billId);
    if (!target) return;

    if (target.isAllServed === false) {
      showToast('Tidak bisa bayar! Masih ada pesanan di dapur yang belum disajikan.', 'warning');
      return;
    }

    const tendered = amountTendered || target.total;
    const { data, error } = await supabase.rpc('pay_session', { p_session: target.sessionId, p_method: METHOD_TO_DB[method], p_received: tendered });

    if (error || data?.error) {
      const msg = error?.message || data?.error || 'Gagal memproses pembayaran';
      showToast(msg, 'warning');
      return;
    }

    const paidBill: BillItem = {
      ...target,
      status: 'lunas',
      isAllServed: true,
      unservedCount: 0,
      paymentMethod: METHOD_TO_DB[method] === 'cash' ? 'tunai' : (METHOD_TO_DB[method] as any),
      cashTendered: tendered,
      changeAmount: Number(data?.change) || 0,
      paidAtTime: `${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace('.', ':')} WIB`,
    };
    saveRecentReceipt(paidBill);
    setReceiptModalData(paidBill);
    setSelectedBillId('');
    showToast(`Pembayaran Meja ${target.tableNumber} LUNAS via ${method}!`, 'success');
    await refresh();
  };

  // ---------- aksi: dapur ----------
  const advanceTicketStatus = async (ticketId: string) => {
    const { data, error } = await supabase.rpc('advance_order', { p_order: Number(ticketId) });
    if (error || data?.error) { showToast(error?.message || data.error, 'warning'); return; }
    await refresh();
  };

  // ---------- aksi: menu ----------
  const categoryId = async (name: string) => {
    const found = categories.find((c) => c.name === name);
    if (found) return found.category_id as number;
    const { data } = await supabase.from('categories').insert({ name }).select('category_id').single();
    return data?.category_id as number;
  };
  const productPayload = async (i: MenuItem) => ({
    name: i.name, price: i.price, description: i.description || null, is_available: i.isAvailable,
    is_favorite: !!i.isFavorite, is_signature: !!i.isSignature, category_id: await categoryId(i.category),
    image_url: i.image && !isPlaceholder(i.image) ? i.image : null,
  });
  const updateMenuItem = async (item: MenuItem) => {
    await run(supabase.from('products').update({ ...(await productPayload(item)), updated_at: new Date().toISOString() }).eq('product_id', item.dbId),
      `Menu ${item.name} diperbarui`);
  };
  const addMenuItem = async (item: MenuItem) => {
    const code = item.code && !/^RG-\d+$/.test(item.code) ? item.code : 'P' + Date.now().toString().slice(-6);
    await run(supabase.from('products').insert({ ...(await productPayload(item)), product_code: code }), `Menu baru ${item.name} berhasil ditambahkan!`);
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
      currentUser, currentRole, setCurrentRole, isLoggedIn, authLoading, dataReady, login, logout,
      activeView, setActiveView, viewportMode, setViewportMode, outletName, setOutletName,
      tables, selectedTableId, setSelectedTableId, updateTable, addTable, deleteTable,
      cartItems, orderTableNumber, setOrderTableNumber, orderCustomerName, setOrderCustomerName, orderGuestCount, setOrderGuestCount,
      kitchenGeneralNote, setKitchenGeneralNote, addToCart, removeFromCart, updateCartQuantity, updateCartItemNotes, clearCart,
      sendOrderToKitchen, saveDraftOrder,
      bills, selectedBillId, setSelectedBillId, selectedBill, settlePayment,
      menuItems, menuCategories, updateMenuItem, addMenuItem, deleteMenuItem,
      rawIngredients, lowStockIngredients, updateIngredientStock, restockIngredient, updateIngredientMinimum, addRawIngredient, deleteRawIngredient,
      dismissStockWarning, setDismissStockWarning,
      kitchenTickets, advanceTicketStatus, transactions, recentReceipts,
      toast, showToast, receiptModalData, openReceiptModal: setReceiptModalData, closeReceiptModal: () => setReceiptModalData(null),
      qrModalTable, openQrModal: setQrModalTable, closeQrModal: () => setQrModalTable(null),
      desktopSidebarOpen, setDesktopSidebarOpen, toggleDesktopSidebar,
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
