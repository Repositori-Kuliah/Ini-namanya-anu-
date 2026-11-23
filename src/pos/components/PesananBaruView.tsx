import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem } from '../types';
import { useLockBodyScroll } from '../../lib/useLockBodyScroll';
import { useScrollDirection } from '../../lib/useScrollDirection';

export const PesananBaruView: React.FC = () => {
  const isHeaderVisible = useScrollDirection();
  const {
    menuItems,
    menuCategories,
    cartItems,
    orderTableNumber,
    setOrderTableNumber,
    orderSecondaryTables,
    setOrderSecondaryTables,
    orderType,
    setOrderType,
    takeawayNextQueue,
    orderCustomerName,
    setOrderCustomerName,
    orderGuestCount,
    setOrderGuestCount,
    kitchenGeneralNote,
    setKitchenGeneralNote,
    addToCart,
    updateCartQuantity,
    updateCartItemNotes,
    removeFromCart,
    sendOrderToKitchen,
    tables,
    storeSettings,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccessSent, setIsSuccessSent] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showMultiTableSelector, setShowMultiTableSelector] = useState(false);

  // Kunci scroll halaman latar saat bottom sheet pesanan di mobile terbuka
  useLockBodyScroll(mobileDrawerOpen);

  // Gesture Swipe / Drag Naik Turun Bottom Sheet Mobile ala Gojek
  const [sheetTranslateY, setSheetTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartYRef = React.useRef(0);
  const currentTranslateRef = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartYRef.current;
    if (deltaY > 0) {
      currentTranslateRef.current = deltaY;
      setSheetTranslateY(deltaY);
    } else {
      const resistance = deltaY * 0.15;
      currentTranslateRef.current = resistance;
      setSheetTranslateY(resistance);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (currentTranslateRef.current > 70) {
      setMobileDrawerOpen(false);
      setSheetTranslateY(0);
      currentTranslateRef.current = 0;
    } else {
      setSheetTranslateY(0);
      currentTranslateRef.current = 0;
    }
  };

  // Modal edit catatan per-item
  const [editingNoteItem, setEditingNoteItem] = useState<{ id: string; name: string; notes: string } | null>(null);

  // Filter daftar menu
  const filteredMenu = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeCategory === 'Semua') return true;
    if (activeCategory === 'Favorit') return Boolean(item.isFavorite || item.isRecommended);
    return item.category === activeCategory;
  });

  // Kalkulasi total biaya pesanan (Modular Pajak, Layanan, & Pembulatan)
  const subtotal = cartItems.reduce((acc, curr) => acc + curr.menuItem.price * curr.quantity, 0);
  const totalItemCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  const enableService = storeSettings?.enableServiceCharge ?? true;
  const serviceRate = enableService ? (storeSettings?.serviceChargeRate ?? 5) / 100 : 0;
  const serviceCharge = Math.round(subtotal * serviceRate);

  const enableTax = storeSettings?.enableTax ?? true;
  const taxRate = enableTax ? (storeSettings?.taxRate ?? 10) / 100 : 0;
  const pb1Tax = Math.round((subtotal + serviceCharge) * taxRate);

  let grandTotal = subtotal + serviceCharge + pb1Tax;
  if (storeSettings?.roundingRule === '100') grandTotal = Math.ceil(grandTotal / 100) * 100;
  else if (storeSettings?.roundingRule === '500') grandTotal = Math.round(grandTotal / 500) * 500;
  else if (storeSettings?.roundingRule === '1000') grandTotal = Math.ceil(grandTotal / 1000) * 1000;

  const handleKirimKitchen = async () => {
    if (cartItems.length === 0 || isSending) return;
    setIsSending(true);
    const ok = await sendOrderToKitchen();
    setIsSending(false);
    if (ok) {
      setIsSuccessSent(true);
      setTimeout(() => {
        setIsSuccessSent(false);
        setMobileDrawerOpen(false);
      }, 1500);
    }
  };

  const openNoteEditor = (menuItem: MenuItem, currentNote = '') => {
    setEditingNoteItem({
      id: menuItem.id,
      name: menuItem.name,
      notes: currentNote,
    });
  };

  const saveNoteEditor = () => {
    if (editingNoteItem) {
      updateCartItemNotes(editingNoteItem.id, editingNoteItem.notes);
      setEditingNoteItem(null);
    }
  };

  // Render Rincian Pesanan (digunakan di sidebar Desktop dan bottom sheet Mobile)
  const renderOrderSummaryContent = () => (
    <>
      {/* Switcher Tipe Layanan: Santap di Tempat vs Bawa Pulang */}
      <div className="grid grid-cols-2 p-1 bg-[#f0ede9] rounded-xl text-xs font-bold shrink-0">
        <button
          type="button"
          onClick={() => setOrderType('dine_in')}
          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            orderType === 'dine_in'
              ? 'bg-[#3d1018] text-white shadow-xs'
              : 'text-[#847374] hover:text-[#1c1c19]'
          }`}
        >
          <span>Santap di Tempat</span>
        </button>
        <button
          type="button"
          onClick={() => setOrderType('takeaway')}
          className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            orderType === 'takeaway'
              ? 'bg-[#3d1018] text-white shadow-xs'
              : 'text-[#847374] hover:text-[#1c1c19]'
          }`}
        >
          <span>Bawa Pulang</span>
        </button>
      </div>

      {/* Target Meja / Antrean Bungkus */}
      <div className="pb-3 border-b border-[#ebe8e3]">
        {orderType === 'dine_in' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-start">
            {/* Dropdown Meja Utama */}
            <div>
              <label htmlFor="order-table" className="text-[10px] text-[#847374] block mb-0.5 h-4 leading-4 truncate whitespace-nowrap">
                No. Meja
              </label>
              <select
                id="order-table"
                value={orderTableNumber}
                onChange={(e) => setOrderTableNumber(e.target.value)}
                className="w-full bg-[#fcf9f4] border border-[#ebe8e3] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#1c1c19] outline-none cursor-pointer focus:border-[#3d1018]"
              >
                {tables.map((t) => (
                  <option key={t.number} value={t.number}>
                    Meja {t.number}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Nama Pemesan */}
            <div>
              <label htmlFor="order-customer" className="text-[10px] text-[#847374] block mb-0.5 h-4 leading-4 truncate whitespace-nowrap">
                Nama Pemesan
              </label>
              <input
                id="order-customer"
                type="text"
                value={orderCustomerName}
                onChange={(e) => setOrderCustomerName(e.target.value)}
                placeholder="Nama pemesan..."
                className="w-full bg-[#fcf9f4] border border-[#ebe8e3] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#1c1c19] outline-none focus:border-[#3d1018]"
              />
            </div>
          </div>
        ) : (
          <div>
            {/* Nama Pemesan */}
            <label htmlFor="takeaway-customer" className="text-[10px] text-[#847374] block mb-0.5 h-4 leading-4 truncate whitespace-nowrap">
              Nama Pemesan
            </label>
            <input
              id="takeaway-customer"
              type="text"
              value={orderCustomerName}
              onChange={(e) => setOrderCustomerName(e.target.value)}
              placeholder="Nama pemesan..."
              className="w-full bg-[#fcf9f4] border border-[#ebe8e3] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#1c1c19] outline-none focus:border-[#3d1018]"
            />
          </div>
        )}
      </div>

      {/* Daftar Menu Yang Dipilih Dalam Keranjang */}
      <div className="flex-1 min-h-[140px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344]">
            Daftar Pesanan ({totalItemCount} item)
          </span>
        </div>

        {cartItems.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-[#ebe8e3] rounded-xl text-xs text-[#847374] leading-relaxed">
            Keranjang masih kosong.
            <br />
            Pilih menu dari katalog untuk mulai memesan.
          </div>
        ) : (
          <div className="divide-y divide-[#ebe8e3] text-xs max-h-56 overflow-y-auto pr-1">
            {cartItems.map((ci) => (
              <div key={ci.menuItem.id} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-[#1c1c19] block truncate">
                      {ci.menuItem.name}
                    </span>
                    <span className="text-[11px] text-[#847374]">
                      Rp {ci.menuItem.price.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Tombol Kuantitas & Hapus */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-[#f0ede9] rounded-lg p-0.5 border border-[#e0dcd8]">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(ci.menuItem.id, -1)}
                        className="w-7 h-7 sm:w-6 sm:h-6 rounded bg-white text-[#1c1c19] flex items-center justify-center font-bold text-xs hover:bg-[#ebe8e3] cursor-pointer"
                        aria-label={`Kurangi ${ci.menuItem.name}`}
                      >
                        <span className="material-symbols-outlined text-[15px] sm:text-[13px]">remove</span>
                      </button>
                      <span className="w-7 sm:w-6 text-center font-bold text-xs tabular-nums">
                        {ci.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(ci.menuItem.id, 1)}
                        className="w-7 h-7 sm:w-6 sm:h-6 rounded bg-[#3d1018] text-white flex items-center justify-center font-bold text-xs hover:bg-[#58252c] cursor-pointer"
                        aria-label={`Tambah ${ci.menuItem.name}`}
                      >
                        <span className="material-symbols-outlined text-[15px] sm:text-[13px]">add</span>
                      </button>
                    </div>

                    <span className="font-bold text-xs text-[#1c1c19] tabular-nums w-16 text-right">
                      Rp {(ci.menuItem.price * ci.quantity).toLocaleString('id-ID')}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeFromCart(ci.menuItem.id)}
                      className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-[#ba1a1a] hover:bg-[#93000a] text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                      aria-label={`Hapus ${ci.menuItem.name} dari pesanan`}
                    >
                      <span className="material-symbols-outlined text-[17px] sm:text-[16px]">delete</span>
                    </button>
                  </div>
                </div>

                {/* Catatan Item */}
                <div className="flex items-center justify-between text-[11px] pl-1">
                  <button
                    type="button"
                    onClick={() => openNoteEditor(ci.menuItem, ci.notes)}
                    className="text-[#994703] font-semibold hover:underline shrink-0 mr-2 cursor-pointer flex items-center"
                  >
                    <span>{ci.notes ? 'Ubah Catatan' : '+ Catatan'}</span>
                  </button>
                  <span className="text-[#847374] truncate text-right">
                    {ci.notes ? `Catatan: ${ci.notes}` : 'Tanpa catatan khusus'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catatan Umum Dapur */}
      <div className="pt-2 border-t border-[#ebe8e3]">
        <label htmlFor="general-note" className="text-[10px] text-[#847374] font-bold uppercase block mb-1">
          Catatan Umum Dapur
        </label>
        <input
          id="general-note"
          type="text"
          value={kitchenGeneralNote}
          onChange={(e) => setKitchenGeneralNote(e.target.value)}
          placeholder="Contoh: Makanan disajikan bersamaan / sambal dipisah..."
          className="w-full bg-[#fcf9f4] border border-[#ebe8e3] rounded-lg px-2.5 py-1.5 text-xs text-[#1c1c19] outline-none focus:border-[#3d1018]"
        />
      </div>

      {/* Rincian Finansial (Subtotal, PB1, Service, Total) */}
      <div className="pt-3 border-t border-[#ebe8e3] space-y-1.5 text-xs">
        <div className="flex justify-between text-[#524344]">
          <span>Subtotal ({totalItemCount} item)</span>
          <span className="font-medium text-[#1c1c19] tabular-nums">
            Rp {subtotal.toLocaleString('id-ID')}
          </span>
        </div>
        {enableService && serviceCharge > 0 && (
          <div className="flex justify-between text-[#524344]">
            <span>{storeSettings?.serviceChargeName || 'Biaya Layanan'} ({storeSettings?.serviceChargeRate ?? 5}%)</span>
            <span className="font-medium text-[#1c1c19] tabular-nums">
              Rp {serviceCharge.toLocaleString('id-ID')}
            </span>
          </div>
        )}
        {enableTax && pb1Tax > 0 && (
          <div className="flex justify-between text-[#524344]">
            <span>{storeSettings?.taxName || 'PB1 (Pajak Restoran)'} ({storeSettings?.taxRate ?? 10}%)</span>
            <span className="font-medium text-[#1c1c19] tabular-nums">
              Rp {pb1Tax.toLocaleString('id-ID')}
            </span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-[#ebe8e3] items-baseline">
          <span className="text-sm font-bold text-[#1c1c19]">TOTAL</span>
          <span className="text-xl font-bold text-[#3d1018] tabular-nums">
            Rp {grandTotal.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Tombol Tindakan */}
      <div className="flex gap-2 pt-1 pb-3 sm:pb-0">
        <button
          type="button"
          onClick={handleKirimKitchen}
          disabled={isSending || cartItems.length === 0}
          className={`w-full py-3.5 sm:py-3 px-4 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
            isSuccessSent
              ? 'bg-[#3d1018] ring-2 ring-[#fc934f]'
              : cartItems.length === 0
              ? 'bg-[#847374] opacity-50 cursor-not-allowed'
              : 'bg-[#3d1018] hover:bg-[#58252c] active:scale-[0.99]'
          }`}
        >
          {isSending ? (
            <>
              <span className="material-symbols-outlined text-[18px] animate-spin">
                sync
              </span>
              <span>Mengirim ke Dapur...</span>
            </>
          ) : isSuccessSent ? (
            <>
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Terkirim ke Kitchen!</span>
            </>
          ) : (
            <span>
              {orderType === 'takeaway' ? 'Kirim Pesanan Bungkus' : 'Kirim ke Kitchen'} (Rp {grandTotal.toLocaleString('id-ID')})
            </span>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col w-full pb-4 md:pb-8 max-w-[1600px] mx-auto px-4 sm:px-6 pt-3">
      {/* Grid Dua Kolom: KIRI (Katalog Menu) & KANAN (Ringkasan Pesanan Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            LEFT AREA: MENU CATALOG (7 Kolom pada Desktop, Full pada Mobile)
           ========================================================================= */}
        <section
          aria-label="Katalog Menu Restoran"
          className={`lg:col-span-7 flex flex-col gap-3 ${totalItemCount > 0 ? 'pb-28 lg:pb-0' : 'pb-6 lg:pb-0'}`}
        >
          {/* Baris Pencarian & Kategori (Smart Collapsible Header di Mobile) */}
          <div className={`flex flex-col gap-2.5 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-[#ebe8e3] sticky top-16 lg:top-20 z-20 shadow-xs transition-all duration-300 ease-in-out ${
            isHeaderVisible ? 'translate-y-0 opacity-100' : 'max-lg:-translate-y-36 max-lg:opacity-0 max-lg:pointer-events-none'
          }`}>
            {/* Input Pencarian */}
            <div className="relative flex items-center bg-[#fcf9f4] px-3 py-2 rounded-lg border border-[#ebe8e3] focus-within:border-[#3d1018]">
              <span className="material-symbols-outlined text-[18px] text-[#847374] mr-2">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari rawon, kuah, teh, kopi, pelengkap..."
                className="bg-transparent w-full text-xs sm:text-sm text-[#1c1c19] placeholder-[#847374] outline-none"
                aria-label="Cari menu"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#847374] hover:text-[#1c1c19] text-xs cursor-pointer"
                  aria-label="Hapus kata kunci"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Filter Kategori Horizontal dengan scroll Mouse Wheel */}
            <div
              onWheel={(e) => {
                if (e.deltaY !== 0) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 cursor-grab"
            >
              <button
                type="button"
                onClick={() => setActiveCategory('Semua')}
                className={`h-8 px-3 rounded-lg text-xs font-bold transition-all shrink-0 inline-flex items-center justify-center cursor-pointer ${
                  activeCategory === 'Semua'
                    ? 'bg-[#3d1018] text-white shadow-2xs'
                    : 'bg-[#f0ede9] text-[#524344] hover:bg-[#e0dcd8]'
                }`}
              >
                Semua ({menuItems.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('Favorit')}
                className={`h-8 px-3 rounded-lg text-xs font-bold transition-all shrink-0 inline-flex items-center justify-center cursor-pointer ${
                  activeCategory === 'Favorit'
                    ? 'bg-[#3d1018] text-white shadow-2xs'
                    : 'bg-[#f0ede9] text-[#524344] hover:bg-[#e0dcd8]'
                }`}
              >
                Favorit
              </button>

              {menuCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`h-8 px-3 rounded-lg text-xs font-bold transition-all shrink-0 inline-flex items-center justify-center cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#3d1018] text-white shadow-2xs'
                      : 'bg-[#f0ede9] text-[#524344] hover:bg-[#e0dcd8]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Daftar Menu: Menyesuaikan konten secara alami tanpa batas wadah kaku */}
          <div className="bg-white rounded-xl border border-[#ebe8e3] divide-y divide-[#ebe8e3] shadow-xs">
            {filteredMenu.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#847374]">
                Tidak ada menu yang sesuai dengan kata kunci &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredMenu.map((item) => {
                const cartEntry = cartItems.find((ci) => ci.menuItem.id === item.id);
                const quantity = cartEntry ? cartEntry.quantity : 0;
                const isOut = item.isAvailable === false;

                return (
                  <div
                    key={item.id}
                    className={`p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-[#fcf9f4] transition-colors ${
                      isOut ? 'opacity-70 bg-[#fbf9f8]' : ''
                    }`}
                  >
                    {/* Info Menu Kiri (Nama + Kategori) */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold text-xs sm:text-sm truncate ${isOut ? 'text-[#847374] line-through' : 'text-[#1c1c19]'}`}>
                          {item.name}
                        </span>
                        {Boolean(item.isFavorite || item.isRecommended) && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            <span className="material-symbols-outlined text-[11px] text-amber-600">star</span>
                            <span>Favorit</span>
                          </span>
                        )}
                        {isOut && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f0ede9] text-[#ba1a1a] font-bold">
                            Habis
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#847374] block truncate mt-0.5">
                        {item.category}
                      </span>
                    </div>

                    {/* Harga & Tombol Tambah Kanan */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-xs sm:text-sm text-[#3d1018] tabular-nums">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>

                      {isOut ? (
                        <button
                          type="button"
                          disabled
                          className="px-2.5 py-1.5 rounded-lg bg-[#f0ede9] text-[#847374] font-bold text-xs cursor-not-allowed"
                        >
                          Kosong
                        </button>
                      ) : quantity > 0 ? (
                        <div className="flex items-center bg-[#f0ede9] rounded-lg p-0.5 border border-[#e0dcd8]">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="w-8 h-8 sm:w-7 sm:h-7 rounded bg-white text-[#1c1c19] flex items-center justify-center font-bold text-xs hover:bg-[#ebe8e3] cursor-pointer"
                            aria-label={`Kurangi ${item.name}`}
                          >
                            <span className="material-symbols-outlined text-[15px] sm:text-[14px]">remove</span>
                          </button>
                          <span className="w-8 sm:w-7 text-center font-bold text-xs text-[#1c1c19] tabular-nums">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="w-8 h-8 sm:w-7 sm:h-7 rounded bg-[#3d1018] text-white flex items-center justify-center font-bold text-xs hover:bg-[#58252c] cursor-pointer"
                            aria-label={`Tambah ${item.name}`}
                          >
                            <span className="material-symbols-outlined text-[15px] sm:text-[14px]">add</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(item, 1)}
                          className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-[#3d1018] hover:bg-[#58252c] text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                          aria-label={`Tambahkan ${item.name}`}
                        >
                          <span className="material-symbols-outlined text-[20px] sm:text-[18px]">add</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* =========================================================================
            RIGHT AREA: ORDER SUMMARY (5 Kolom pada Desktop)
           ========================================================================= */}
        <section
          aria-label="Ringkasan Pesanan Meja"
          className="lg:col-span-5 hidden lg:flex flex-col gap-3.5 bg-white rounded-xl border border-[#ebe8e3] p-4 sm:p-5 lg:sticky lg:top-20 max-h-[calc(100vh-100px)] overflow-y-auto"
        >
          {renderOrderSummaryContent()}
        </section>
      </div>

      {/* Sticky Floating Cart Bar di Mobile ala Gojek */}
      {totalItemCount > 0 && !mobileDrawerOpen && (
        <div className="fixed bottom-[60px] sm:bottom-20 inset-x-0 z-30 px-3.5 py-2 pointer-events-none lg:hidden">
          <button
            type="button"
            onClick={() => {
              setSheetTranslateY(0);
              setMobileDrawerOpen(true);
            }}
            className="w-full bg-[#3d1018] hover:bg-[#58252c] text-white p-3 sm:p-3.5 rounded-2xl shadow-xl flex items-center justify-between pointer-events-auto transition-transform active:scale-[0.99] border border-[#58252c] cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
                <span className="absolute -top-1.5 -right-2 bg-white text-[#3d1018] text-[10px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs">
                  {totalItemCount}
                </span>
              </div>
              <div className="text-left ml-1">
                <span className="text-xs text-white/90 font-semibold block leading-tight">
                  {orderType === 'dine_in' ? `Meja ${orderTableNumber}` : 'Bawa Pulang'}
                </span>
                <span className="text-sm font-bold text-white tabular-nums">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold bg-white/15 px-3 py-1.5 rounded-xl text-white">
              <span>Lihat Pesanan</span>
              <span className="material-symbols-outlined text-[16px]">expand_less</span>
            </div>
          </button>
        </div>
      )}

      {/* Mobile Bottom Sheet Drawer ala Gojek */}
      {mobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-order-drawer-title"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end lg:hidden animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setMobileDrawerOpen(false);
              setSheetTranslateY(0);
            }
          }}
        >
          <div
            style={{
              transform: `translateY(${sheetTranslateY}px)`,
              transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="bg-white rounded-t-3xl shadow-2xl border-t border-[#ebe8e3] max-h-[85vh] flex flex-col duration-200"
          >
            {/* Handle Bar & Header (Bisa digeser/ditarik naik-turun dengan sentuhan jari) */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="pt-3 px-4 pb-2.5 border-b border-[#ebe8e3] shrink-0 touch-none cursor-grab active:cursor-grabbing select-none"
            >
              <div className="w-12 h-1.5 bg-[#d5cfc7] rounded-full mx-auto mb-2.5 active:bg-[#994703]" />
              <div className="flex items-center justify-between">
                <h3 id="mobile-order-drawer-title" className="font-bold text-base text-[#1c1c19]">
                  Pesanan {orderType === 'dine_in' ? `Meja ${orderTableNumber}` : 'Bawa Pulang'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    setSheetTranslateY(0);
                  }}
                  className="w-7 h-7 rounded-full bg-[#f0ede9] hover:bg-[#ebe8e3] text-[#524344] flex items-center justify-center cursor-pointer"
                  aria-label="Tutup pesanan"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>

            {/* Drawer Body (Scrollable Order Summary) */}
            <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
              {renderOrderSummaryContent()}
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Catatan Menu */}
      {editingNoteItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-modal-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 lg:cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget && typeof window !== 'undefined' && window.innerWidth >= 1024) {
              setEditingNoteItem(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl flex flex-col gap-3 border border-[#ebe8e3] cursor-default">
            <div className="flex items-center justify-between border-b border-[#ebe8e3] pb-2">
              <h3 id="note-modal-title" className="font-bold text-sm text-[#3d1018]">
                Catatan: {editingNoteItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingNoteItem(null)}
                className="w-6 h-6 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#524344]"
                aria-label="Tutup modal catatan"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <label htmlFor="item-note-input" className="text-xs text-[#524344]">
              Instruksi masak khusus koki:
            </label>

            <input
              id="item-note-input"
              type="text"
              value={editingNoteItem.notes}
              onChange={(e) =>
                setEditingNoteItem({ ...editingNoteItem, notes: e.target.value })
              }
              placeholder="Contoh: Tidak pedas / Sambal terpisah / Less ice..."
              className="w-full h-10 px-3 bg-[#fcf9f4] text-xs text-[#1c1c19] rounded-lg outline-none border border-[#ebe8e3] focus:border-[#3d1018]"
            />

            {/* Presets Catatan Cepat */}
            <div className="flex flex-wrap gap-1 pt-1">
              {['Tidak pedas', 'Pedas sedang', 'Sambal pisah', 'Less ice', 'Bumbu pisah', 'Kuah pisah'].map(
                (preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setEditingNoteItem({
                        ...editingNoteItem,
                        notes: preset,
                      })
                    }
                    className="px-2 py-1 rounded bg-[#f0ede9] hover:bg-[#ebe8e3] text-[11px] font-medium text-[#1c1c19] cursor-pointer"
                  >
                    {preset}
                  </button>
                )
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingNoteItem(null)}
                className="flex-1 h-9 rounded-lg bg-[#f0ede9] text-[#1c1c19] text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveNoteEditor}
                className="flex-1 h-9 rounded-lg bg-[#3d1018] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
