import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CartItem, CustomizationSelection, MenuItem, ActiveOrder, ScreenType, ExtraOption } from '../types';
import { supabase } from '../../lib/supabase';
import { billOfOrders, type BillOptions } from '../../lib/domain';
import { placeholderImage } from '../../lib/placeholder';

interface ToastState {
  show: boolean;
  message: string;
  type?: 'info' | 'warning' | 'success';
}
export interface MenuCategory { id: string; label: string; }

interface AppContextType {
  currentScreen: ScreenType;
  navigate: (screen: ScreenType) => void;
  /** 'loading' | 'ok' | 'invalid' (token QR tidak ada / tidak aktif) | 'error' */
  tableState: 'loading' | 'ok' | 'invalid' | 'error';
  selectedTable: string;
  tableArea: string;
  guestsCount: number;
  isTableModalOpen: boolean;
  openTableModal: () => void;
  closeTableModal: () => void;
  setGuests: (count: number) => void;
  menuItems: MenuItem[];
  menuCategories: MenuCategory[];
  extraOptions: ExtraOption[];
  cartItems: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  cartServiceFee: number;
  cartTax: number;
  cartTotal: number;
  /** Tarif/biaya dari tabel store_settings (dipakai untuk menghitung tagihan pelanggan). */
  feeSettings: {
    enableService: boolean;
    serviceRate: number;
    serviceName: string;
    enableTax: boolean;
    taxRate: number;
    taxName: string;
    roundingRule: 'none' | '100' | '500' | '1000';
  };
  selectedMenuItem: MenuItem;
  setSelectedMenuItem: (item: MenuItem) => void;
  editingCartItem: CartItem | null;
  openDetail: (item: MenuItem) => void;
  editCartItem: (cartItem: CartItem) => void;
  clearEditingCartItem: () => void;
  addToCart: (item: MenuItem, customization: CustomizationSelection, qty: number) => void;
  updateCartItemDetails: (cartItemId: string, item: MenuItem, customization: CustomizationSelection, qty: number) => void;
  updateCartItemQty: (cartItemId: string, delta: number) => void;
  updateCartQuantity?: (cartItemId: string, delta: number) => void;
  removeCartItem: (cartItemId: string) => void;
  removeFromCart?: (cartItemId: string) => void;
  quickAddToCart: (item: MenuItem) => void;
  activeOrder: ActiveOrder | null;
  submitOrder: (paymentMethod: 'qris' | 'cashier', notes: string) => Promise<boolean>;
  waiterCalled: boolean;
  waiterCooldown: number;
  callWaiter: () => void;
  checkoutRequested: boolean;
  checkoutCooldown: number;
  requestCheckout: () => void;
  toast: ToastState;
  showToast: (message: string, icon?: string) => void;
  formatRupiah: (amount: number) => string;
  tableNotes: string;
  setTableNotes: (notes: string) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  secondaryTables: string[];
  setSecondaryTables: React.Dispatch<React.SetStateAction<string[]>>;
  availableTables: string[];
  kitchenGeneralNote: string;
  setKitchenGeneralNote: (note: string) => void;
  orderType: 'dine_in' | 'takeaway';
  setOrderType: (type: 'dine_in' | 'takeaway') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const EMPTY_ITEM: MenuItem = { id: '', name: '', price: 0, description: '', category: '', categories: [], tags: [], image: '' };
const STAGE: Record<string, 0 | 1 | 2 | 3 | 4> = {
  pending: 0,
  pending_confirmation: 0,
  submitted: 1,
  preparing: 2,
  ready: 3,
  served: 4,
};
const formatRupiah = (n: number) => 'Rp' + n.toLocaleString('id-ID');
const wib = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace(':', '.') + ' WIB';

// Catatan dapur dari pilihan kustomisasi (hanya yang bukan nilai bawaan)
const PEDAS = { '0': 'Tidak pedas', '1': 'Pedas sedang', '2': 'Pedas mantap' } as const;
const noteOf = (c: CustomizationSelection) => [
  c.kuah === 'pisah' && 'Kuah dipisah',
  c.pedas !== '1' && PEDAS[c.pedas],
  c.sayur === 'pisah' && 'Sayur dipisah',
  c.kitchenNotes?.trim(),
].filter(Boolean).join(' • ');

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    // 1. Ambil dari URL jika baru pertama scan QR
    const urlParams = new URLSearchParams(window.location.search);
    const paramToken = urlParams.get('meja');

    if (paramToken) {
      // Simpan di sessionStorage (hanya aktif di tab ini, tidak terbawa jika link disalin)
      try {
        sessionStorage.setItem('rg_active_table_token', paramToken);
      } catch {}
      return paramToken;
    }

    // 2. Jika tidak ada di URL (misal user me-refresh halaman), ambil dari sessionStorage aktif
    try {
      return sessionStorage.getItem('rg_active_table_token') || '';
    } catch {
      return '';
    }
  }, []);

  // Bersihkan parameter token dari address bar setelah terbaca agar URL rapi (/pesan)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('meja=')) {
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {}
    }
  }, []);

  const cartKey = `rawon_gusti_cart_${token}`;

  const [currentScreen, setCurrentScreen] = useState<ScreenType>('menu');
  const [tableState, setTableState] = useState<AppContextType['tableState']>('loading');
  const [selectedTable, setSelectedTable] = useState('');
  const [currentTableDbId, setCurrentTableDbId] = useState<number | null>(null);
  const [tableArea, setTableArea] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [extraOptions, setExtraOptions] = useState<ExtraOption[]>([]);
  //Tarif layanan & pajak diambil dari store_settings supaya struk pelanggan
  // sama dengan yang ditagih kasir (Pengaturan bisa mematikan layanan 5%).
  const [feeSettings, setFeeSettings] = useState<AppContextType['feeSettings']>({
    enableService: true, serviceRate: 5, serviceName: 'Biaya Layanan',
    enableTax: true, taxRate: 10, taxName: 'PB1',
    roundingRule: 'none',
  });
  const billOpts = useMemo<BillOptions>(() => ({
    enableService: feeSettings.enableService,
    serviceRate: feeSettings.serviceRate,
    enableTax: feeSettings.enableTax,
    taxRate: feeSettings.taxRate,
    roundingRule: feeSettings.roundingRule,
  }), [feeSettings]);
  const extraIds = useRef<Record<string, number>>({});
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(cartKey) ?? '[]'); } catch { return []; }
  });
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem>(EMPTY_ITEM);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [waiterCooldown, setWaiterCooldown] = useState(0);
  const [checkoutRequested, setCheckoutRequested] = useState(false);
  const [checkoutCooldown, setCheckoutCooldown] = useState(0);
  const [tableNotes, setTableNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [secondaryTables, setSecondaryTables] = useState<string[]>([]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [kitchenGeneralNote, setKitchenGeneralNote] = useState('');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  // Cooldown countdown timers
  useEffect(() => {
    if (waiterCooldown <= 0) return;
    const timer = setInterval(() => setWaiterCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [waiterCooldown]);

  useEffect(() => {
    if (checkoutCooldown <= 0) return;
    const timer = setInterval(() => setCheckoutCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [checkoutCooldown]);

  useEffect(() => { try { localStorage.setItem(cartKey, JSON.stringify(cartItems)); } catch { /* abaikan */ } }, [cartItems, cartKey]);

  const showToast = useCallback((message: string, typeOrIcon: string = 'info') => {
    let resolvedType: 'info' | 'warning' | 'success' = 'info';
    if (typeOrIcon === 'error' || typeOrIcon === 'warning' || typeOrIcon === 'cancel' || typeOrIcon === 'delete') {
      resolvedType = 'warning';
    } else if (typeOrIcon === 'success' || typeOrIcon === 'done_all' || typeOrIcon === 'check_circle') {
      resolvedType = 'success';
    } else {
      resolvedType = 'info';
    }
    setToast({ show: true, message, type: resolvedType });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 2800);
  }, []);

  // ---------- muat meja + menu ----------
  useEffect(() => {
    if (!token) {
      setTableState('invalid');
      return;
    }
    (async () => {
      try {
        const [cats, prods, ex, allTbls, feeRes] = await Promise.all([
          supabase.from('categories').select('*').order('category_id'),
          supabase.from('products').select('*, categories(name)').order('product_id'),
          supabase.from('extras').select('*').eq('is_available', true).order('extra_id'),
          supabase.from('tables').select('*').eq('is_active', true).order('table_number'),
          supabase.from('store_settings')
            .select('tax_name,tax_rate,enable_tax,service_charge_name,service_charge_rate,enable_service_charge,rounding_rule')
            .limit(1),
        ]);
        if (prods.error) { setTableState('error'); return; }

        const feeRow = feeRes.data?.[0];
        if (feeRow) {
          setFeeSettings({
            enableService: feeRow.enable_service_charge ?? true,
            serviceRate: Number(feeRow.service_charge_rate ?? 5),
            serviceName: feeRow.service_charge_name || 'Biaya Layanan',
            enableTax: feeRow.enable_tax ?? true,
            taxRate: Number(feeRow.tax_rate ?? 10),
            taxName: feeRow.tax_name || 'PB1',
            roundingRule: (feeRow.rounding_rule || 'none') as AppContextType['feeSettings']['roundingRule'],
          });
        }

        const tablesList = allTbls.data || [];
        const row = tablesList.find((m: any) =>
          m.qr_token === token ||
          token === `tbl_token_meja_${String(m.table_number).padStart(2, '0')}` ||
          token === String(m.table_number) ||
          token === String(m.table_number).padStart(2, '0')
        );

        if (!row) { setTableState('invalid'); return; }
        const tblNum = String(row.table_number).padStart(2, '0');
        setSelectedTable(tblNum);
        setCurrentTableDbId(row.table_id);
        setTableArea(row.area || 'Area Pendopo');

        // Deteksi bawa pulang vs santap di tempat
        if (row.area?.toLowerCase().includes('takeaway') || token.toLowerCase().includes('takeaway')) {
          setOrderType('takeaway');
        } else {
          setOrderType('dine_in');
        }

        setAvailableTables(tablesList.map((at: any) => String(at.table_number).padStart(2, '0')));
        setMenuCategories((cats.data ?? []).map((c: any) => ({ id: c.name, label: c.name })));
        const items: MenuItem[] = (prods.data ?? []).filter((p: any) => p.is_available).map((p: any) => {
          const cat = p.categories?.name ?? '';
          return {
            id: String(p.product_id), dbId: p.product_id, name: p.name, price: Number(p.price),
            description: p.description || '', category: cat, categories: [cat], tags: [cat],
            badge: p.is_signature
              ? { text: 'Best Seller', type: 'best_seller' }
              : (p.is_favorite || p.is_recommended)
              ? { text: 'Favorit', type: 'favorite' }
              : undefined,
            image: p.image_url || placeholderImage(p.name),
          } as MenuItem;
        });
        setMenuItems(items);
        setSelectedMenuItem(items[0] ?? EMPTY_ITEM);
        extraIds.current = Object.fromEntries((ex.data ?? []).map((e: any) => [e.name, e.extra_id]));
        setExtraOptions((ex.data ?? []).map((e: any) => ({ id: String(e.extra_id), name: e.name, price: Number(e.price), description: e.description || '' })));
        setTableState('ok');
      } catch {
        setTableState('error');
      }
    })();
  }, [token]);

  // ---------- status pesanan langsung dari database Supabase ----------
  const lastSeen = useRef<ActiveOrder | null>(null);
  const loadOrders = useCallback(async () => {
    if (!currentTableDbId) return;
    try {
      const { data: sess, error } = await supabase
        .from('table_sessions')
        .select('session_id, customer_name, guest_count, opened_at, orders(order_id, order_number, order_status, total, note, created_at, payments(payment_id, status), order_items(order_item_id, product_name, unit_price, quantity, note))')
        .eq('table_id', currentTableDbId)
        .is('closed_at', null)
        .maybeSingle();

      if (!error && sess && sess.orders && sess.orders.length > 0) {
        const orders: any[] = sess.orders;
        const activeOrders = orders.filter((o) => o.order_status !== 'cancelled');
        if (activeOrders.length === 0) {
          setActiveOrder(null);
          return;
        }

        const open = activeOrders.filter((o) => o.order_status !== 'served');
        const stage = open.length ? Math.min(...open.map((o) => STAGE[o.order_status] ?? 1)) : 4;
        const last = activeOrders[activeOrders.length - 1];
        const allItems = activeOrders.flatMap((o) => (o.order_items || []).map((i: any, k: number) => ({
          cartItemId: `${o.order_id}-${k}`,
          menuItemId: '',
          name: i.product_name,
          basePrice: Number(i.unit_price),
          quantity: i.quantity,
          customization: { kitchenNotes: i.note || undefined } as any,
          extraCost: 0,
          totalPrice: Number(i.unit_price) * i.quantity,
          image: menuItems.find((m) => m.name === i.product_name)?.image || placeholderImage(i.product_name),
          subtitleDesc: `${i.quantity}x porsi (${formatRupiah(Number(i.unit_price))})`,
        })));

        const subtotal = allItems.reduce((acc, it) => acc + it.totalPrice, 0);
        const b = billOfOrders([subtotal], billOpts);
        const isPaid = activeOrders.some((o) => (o.payments || []).some((p: any) => p.status === 'paid'));

        const next: ActiveOrder = {
          ticketNumber: '#' + (last.order_number || String(last.order_id)),
          orderNumbers: activeOrders.map((o) => o.order_number || String(o.order_id)),
          tableNumber: selectedTable,
          tableArea,
          guestsCount: sess.guest_count,
          orderTime: wib(activeOrders[0].created_at),
          orderTimestamp: new Date(activeOrders[0].created_at).getTime(),
          items: allItems,
          tableNotes: activeOrders.map((o) => o.note).filter(Boolean).join('; '),
          paymentMethod: 'cashier',
          paymentStatus: isPaid ? 'LUNAS' : 'MENUNGGU DI KASIR',
          statusStage: stage as 0 | 1 | 2 | 3 | 4,
          rawStatus: last.order_status,
          estimatedMinutes: '',
          subtotal: b.subtotal,
          serviceFee: b.service,
          tax: b.tax,
          total: b.total,
        };
        lastSeen.current = next;
        setActiveOrder(next);
        return;
      } else {
        setActiveOrder(null);
      }
    } catch (e) {
      console.warn('loadOrders error:', e);
    }
  }, [currentTableDbId, selectedTable, tableArea, menuItems, billOpts]);

  useEffect(() => {
    if (tableState !== 'ok') return;

    // Load pertama kali
    loadOrders();

    // Polling cerdas: jika ada pesanan yang sedang diproses (stage < 4), polling setiap 15 detik.
    // Jika tidak ada pesanan aktif atau sudah selesai, cukup setiap 60 detik sebagai cadangan.
    const pollInterval = activeOrder && activeOrder.statusStage < 4 ? 15000 : 60000;

    const t = setInterval(() => {
      // Jangan lakukan request jika tab / layar HP terkunci atau di latar belakang
      if (document.hidden) return;
      loadOrders();
    }, pollInterval);

    // Refresh seketika saat pelanggan membuka kembali tab / aplikasi
    const onVisible = () => {
      if (!document.hidden) {
        loadOrders();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [tableState, loadOrders, activeOrder?.statusStage]);

  // ---------- navigasi & meja ----------
  const navigate = (screen: ScreenType) => {
    if (screen !== 'detail') setEditingCartItem(null);
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const setGuests = (n: number) => setGuestsCount(Math.max(1, Math.min(12, n)));
  const openDetail = (item: MenuItem) => {
    setEditingCartItem(null);
    setSelectedMenuItem(item);
    navigate('detail');
  };
  const editCartItem = (cartItem: CartItem) => {
    const matched = menuItems.find((m) => m.id === cartItem.menuItemId) || {
      id: cartItem.menuItemId,
      name: cartItem.name,
      price: cartItem.basePrice,
      description: '',
      category: '',
      categories: [],
      tags: [],
      image: cartItem.image,
    };
    setSelectedMenuItem(matched);
    setEditingCartItem(cartItem);
    setCurrentScreen('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const clearEditingCartItem = () => setEditingCartItem(null);

  // ---------- keranjang (harga tampilan; server menghitung ulang saat pesan) ----------
  const addToCart = (item: MenuItem, customization: CustomizationSelection, qty: number) => {
    const extraCost = customization.extras.reduce((a, n) => a + (extraOptions.find((e) => e.name === n)?.price ?? 0), 0);
    const newItem: CartItem = {
      cartItemId: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, menuItemId: item.id, name: item.name,
      basePrice: item.price, quantity: qty, customization, extraCost, totalPrice: (item.price + extraCost) * qty,
      image: item.image, subtitleDesc: `${qty}x porsi (${formatRupiah(item.price)})`,
    };
    setCartItems((p) => [newItem, ...p]);
    showToast(`${item.name} ditambahkan ke pesanan!`, 'shopping_basket');
  };
  const updateCartItemDetails = (cartItemId: string, item: MenuItem, customization: CustomizationSelection, qty: number) => {
    const extraCost = customization.extras.reduce((a, n) => a + (extraOptions.find((e) => e.name === n)?.price ?? 0), 0);
    setCartItems((p) =>
      p.map((c) =>
        c.cartItemId === cartItemId
          ? {
              ...c,
              customization,
              quantity: qty,
              extraCost,
              totalPrice: (item.price + extraCost) * qty,
              subtitleDesc: `${qty}x porsi (${formatRupiah(item.price)})`,
            }
          : c
      )
    );
    setEditingCartItem(null);
    showToast(`Kustomisasi ${item.name} diperbarui!`, 'check_circle');
  };
  const quickAddToCart = (item: MenuItem) => addToCart(item, { kuah: 'campur', pedas: '1', sayur: 'lengkap', extras: [] }, 1);
  const updateCartItemQty = (id: string, delta: number) =>
    setCartItems((p) => p.map((i) => {
      if (i.cartItemId !== id) return i;
      const q = i.quantity + delta;
      return q <= 0 ? null : { ...i, quantity: q, totalPrice: (i.basePrice + i.extraCost) * q, subtitleDesc: `${q}x porsi (${formatRupiah(i.basePrice)})` };
    }).filter(Boolean) as CartItem[]);
  const removeCartItem = (id: string) => { setCartItems((p) => p.filter((i) => i.cartItemId !== id)); showToast('Menu dihapus dari keranjang', 'delete'); };

  const cartCount = cartItems.reduce((a, i) => a + i.quantity, 0);
  const b = billOfOrders(cartItems.length ? [cartItems.reduce((a, i) => a + i.totalPrice, 0)] : [], billOpts);
  const cartSubtotal = b.subtotal, cartServiceFee = b.service, cartTax = b.tax, cartTotal = b.total;

  const submitOrder = async (_paymentMethod: 'qris' | 'cashier', notes: string): Promise<boolean> => {
    if (!cartItems.length || !currentTableDbId) return false;
    try {
      // Gabungkan catatan pelanggan: nama tamu, meja gabung, catatan koki
      const noteParts: string[] = [];
      if (customerName.trim()) noteParts.push(`Tamu: ${customerName.trim()}`);
      if (secondaryTables.length > 0) noteParts.push(`Gabung Meja: ${secondaryTables.join(', ')}`);
      if (kitchenGeneralNote.trim()) noteParts.push(kitchenGeneralNote.trim());
      if (notes && notes.trim() && !noteParts.includes(notes.trim())) noteParts.push(notes.trim());
      const compiledNotes = noteParts.join(' • ');

      // 1. Dapatkan atau buat sesi aktif di Supabase
      let activeSessionId: number | null = null;
      const { data: existingSess } = await supabase
        .from('table_sessions')
        .select('session_id')
        .eq('table_id', currentTableDbId)
        .is('closed_at', null)
        .maybeSingle();

      if (existingSess) {
        activeSessionId = existingSess.session_id;
        if (customerName) {
          await supabase.from('table_sessions').update({ customer_name: customerName }).eq('session_id', activeSessionId);
        }
      } else {
        const { data: newSess, error: sessErr } = await supabase
          .from('table_sessions')
          .insert({
            table_id: currentTableDbId,
            guest_count: guestsCount || 1,
            customer_name: customerName || `Tamu Meja ${selectedTable}`,
            is_takeaway: orderType === 'takeaway',
          })
          .select('session_id')
          .single();

        if (sessErr || !newSess) {
          showToast('Gagal membuat sesi pesanan di Supabase', 'error');
          return false;
        }
        activeSessionId = newSess.session_id;
      }

      if (!activeSessionId) {
        showToast('Gagal memvalidasi sesi meja di database', 'error');
        return false;
      }

      // 2. Buat Order di Supabase (order_source: 'qr')
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const dateCode = `${yy}${mm}${dd}`;
      const seq = String(activeSessionId).slice(-3).padStart(3, '0');
      const baseOrderNumber = orderType === 'takeaway' ? `TA-${dateCode}-${seq}` : `DIN-${dateCode}-${seq}`;

      // Cek jumlah pesanan yang sudah ada di sesi ini untuk penomoran pesan tambahan unik
      const { count: existingOrdersCount } = await supabase
        .from('orders')
        .select('order_id', { count: 'exact', head: true })
        .eq('session_id', activeSessionId);

      let orderNumber = baseOrderNumber;
      if (existingOrdersCount && existingOrdersCount > 0) {
        orderNumber = `${baseOrderNumber}-${existingOrdersCount + 1}`;
      }

      // Verifikasi keunikan mutlak agar tidak melanggar unique constraint orders_order_number_key
      const { data: duplicateCheck } = await supabase
        .from('orders')
        .select('order_id')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (duplicateCheck) {
        const randSuffix = Math.floor(10 + Math.random() * 90);
        orderNumber = `${orderNumber}-${randSuffix}`;
      }

      const { data: createdOrd, error: ordErr } = await supabase
        .from('orders')
        .insert({
          session_id: activeSessionId,
          order_number: orderNumber,
          order_source: 'qr',
          order_status: 'pending_confirmation',
          total: cartTotal,
          note: compiledNotes || null,
        })
        .select('order_id, order_number')
        .single();

      if (ordErr || !createdOrd) {
        showToast('Gagal mengirim pesanan: ' + (ordErr?.message || 'Error'), 'error');
        return false;
      }

      // 3. Masukkan item pesanan ke order_items
      const itemsPayload = cartItems.map((c) => ({
        order_id: createdOrd.order_id,
        product_id: Number(c.menuItemId),
        product_name: c.name,
        unit_price: c.basePrice,
        quantity: c.quantity,
        note: noteOf(c.customization) || null,
      }));

      await supabase.from('order_items').insert(itemsPayload);

      setCartItems([]);
      await loadOrders();
      showToast('Pesanan berhasil dikirim ke Dapur!', 'done_all');
      return true;
    } catch {
      showToast('Koneksi terputus saat mengirim pesanan, silakan coba lagi', 'error');
      return false;
    }
  };

  const request = async (kind: 'waiter' | 'checkout') => {
    const { data, error } = await supabase.rpc('request_service', { p_token: token, p_kind: kind });
    if (error || data?.error) {
      const msg = data?.error || error?.message || 'Permintaan gagal, silakan coba lagi';
      showToast(msg, 'error');
      return false;
    }
    return true;
  };
  const callWaiter = async () => {
    if (waiterCooldown > 0) {
      showToast(`Harap tunggu ${waiterCooldown}s sebelum memanggil pelayan kembali.`, 'info');
      return;
    }
    if (await request('waiter')) {
      setWaiterCalled(true);
      setWaiterCooldown(60);
      showToast(`Pelayan sedang menuju ke Meja ${selectedTable}. Mohon tunggu sejenak.`, 'room_service');
    }
  };

  const requestCheckout = async () => {
    if (checkoutCooldown > 0) {
      showToast(`Harap tunggu ${checkoutCooldown}s sebelum meminta tagihan lagi.`, 'info');
      return;
    }
    if (await request('checkout')) {
      setCheckoutRequested(true);
      setCheckoutCooldown(60);
      showToast('Kasir akan segera membawa tagihan ke meja Anda.', 'receipt_long');
    }
  };

  return (
    <AppContext.Provider value={{
      currentScreen, navigate, tableState, selectedTable, tableArea, guestsCount, isTableModalOpen,
      openTableModal: () => setIsTableModalOpen(true), closeTableModal: () => setIsTableModalOpen(false), setGuests,
      menuItems, menuCategories, extraOptions, cartItems, cartCount, cartSubtotal, cartServiceFee, cartTax, cartTotal,
      feeSettings,
      selectedMenuItem, setSelectedMenuItem, editingCartItem, openDetail, editCartItem, clearEditingCartItem,
      addToCart, updateCartItemDetails, updateCartItemQty, removeCartItem, quickAddToCart,
      updateCartQuantity: updateCartItemQty, removeFromCart: removeCartItem,
      activeOrder, submitOrder, waiterCalled, waiterCooldown, callWaiter, checkoutRequested, checkoutCooldown, requestCheckout,
      toast, showToast, formatRupiah, tableNotes, setTableNotes,
      customerName, setCustomerName, secondaryTables, setSecondaryTables,
      availableTables, kitchenGeneralNote, setKitchenGeneralNote, orderType, setOrderType,
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
