import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';

export const MenuScreen: React.FC = () => {
  const {
    selectedTable,
    customerName,
    setCustomerName,
    cartItems,
    cartCount,
    cartSubtotal,
    cartTotal,
    formatRupiah,
    menuItems,
    menuCategories,
    addToCart,
    updateCartItemQty,
    updateCartItemDetails,
    removeCartItem,
    submitOrder,
    navigate,
    kitchenGeneralNote,
    setKitchenGeneralNote,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState<boolean>(false);

  // Touch gesture physics untuk swipe-to-close Bottom Sheet
  const [sheetTranslateY, setSheetTranslateY] = useState<number>(0);
  const touchStartY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
    setSheetTranslateY(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setSheetTranslateY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (sheetTranslateY > 100) {
      setIsCartSheetOpen(false);
    }
    setSheetTranslateY(0);
  };

  // Modal edit catatan per item
  const [editingNoteItem, setEditingNoteItem] = useState<{
    cartItemId: string;
    name: string;
    note: string;
  } | null>(null);

  // Lock body scroll when bottom sheet or note modal is open
  React.useEffect(() => {
    if (isCartSheetOpen || Boolean(editingNoteItem)) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartSheetOpen, editingNoteItem]);

  // Daftar Kategori
  const categories = useMemo(() => {
    return [
      'Semua',
      'Favorit',
      ...menuCategories.map((c) => c.label).filter((c) => c !== 'Semua' && c !== 'Favorit'),
    ];
  }, [menuCategories]);

  // Filter Menu
  const filteredMenu = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchesSearch =
        q === '' ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (activeCategory === 'Semua') return true;
      if (activeCategory === 'Favorit') return !!item.badge;
      return item.category === activeCategory;
    });
  }, [searchQuery, activeCategory, menuItems]);

  // Map kuantitas di keranjang per menuItemId
  const cartQtyByMenuId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of cartItems) {
      map[c.menuItemId] = (map[c.menuItemId] || 0) + c.quantity;
    }
    return map;
  }, [cartItems]);

  const handleOpenNote = (item: typeof cartItems[number]) => {
    setEditingNoteItem({
      cartItemId: item.cartItemId,
      name: item.name,
      note: item.customization?.kitchenNotes || '',
    });
  };

  const handleSaveNote = () => {
    if (!editingNoteItem) return;
    const target = cartItems.find((c) => c.cartItemId === editingNoteItem.cartItemId);
    if (target) {
      const matched = menuItems.find((m) => m.id === target.menuItemId) || {
        id: target.menuItemId,
        name: target.name,
        price: target.basePrice,
        description: '',
        category: '',
        categories: [],
        tags: [],
        image: target.image,
      };
      updateCartItemDetails(
        target.cartItemId,
        matched,
        {
          ...target.customization,
          kitchenNotes: editingNoteItem.note.trim() || undefined,
        },
        target.quantity
      );
    }
    setEditingNoteItem(null);
  };

  // Langsung kirim pesanan ke dapur
  const handleKirimKeDapur = async () => {
    if (cartItems.length === 0 || isSending) return;
    setIsSending(true);

    const ok = await submitOrder('cashier', kitchenGeneralNote);
    setIsSending(false);

    if (ok) {
      setIsCartSheetOpen(false);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#3d1018', '#994703', '#fc934f', '#ffdbc9'],
        });
      } catch {}

      navigate('status');
    }
  };

  // Konten Ringkasan Pesanan (digunakan pada Desktop Sidebar & Mobile Bottom Sheet)
  const OrderSummaryContent = (
    <>
      {/* Target Meja & Nama Pemesan */}
      <div className="pb-3 border-b border-[#ebe8e3]">
        <div className="grid grid-cols-2 gap-2.5 items-start">
          {/* Display Meja */}
          <div>
            <label className="text-[10px] text-[#847374] block mb-0.5 h-4 leading-4 truncate">
              No. Meja
            </label>
            <div
              className="w-full bg-[#f0ede9] border border-[#ebe8e3] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#3d1018] flex items-center cursor-not-allowed select-none"
              title="Nomor meja sesuai QR yang dipindai"
            >
              <span>Meja {selectedTable || '01'}</span>
            </div>
          </div>

          {/* Input Nama Pemesan */}
          <div>
            <label htmlFor="customer-name-field" className="text-[10px] text-[#847374] block mb-0.5 h-4 leading-4 truncate">
              Nama Pemesan
            </label>
            <input
              id="customer-name-field"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Contoh: Bpk. Budi"
              className="w-full bg-[#fcf9f4] border border-[#ebe8e3] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#1c1c19] outline-none focus:border-[#3d1018]"
            />
          </div>
        </div>
      </div>

      {/* Daftar Menu Yang Dipilih Dalam Keranjang */}
      <div className="flex-1 min-h-[140px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344]">
            Daftar Pesanan ({cartCount} item)
          </span>
        </div>

        {cartItems.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-[#ebe8e3] rounded-xl text-xs text-[#847374] leading-relaxed font-sans">
            Keranjang masih kosong.
            <br />
            Pilih menu dari katalog untuk mulai memesan.
          </div>
        ) : (
          <div className="divide-y divide-[#ebe8e3] text-xs max-h-56 overflow-y-auto pr-1">
            {cartItems.map((ci) => (
              <div key={ci.cartItemId} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-[#1c1c19] block truncate">
                      {ci.name}
                    </span>
                    <span className="text-[11px] text-[#847374]">
                      {formatRupiah(ci.basePrice)}
                    </span>
                  </div>

                  {/* Tombol Kuantitas & Hapus */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-[#f0ede9] rounded-lg p-0.5 border border-[#e0dcd8]">
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(ci.cartItemId, -1)}
                        className="w-7 h-7 sm:w-6 sm:h-6 rounded bg-white text-[#1c1c19] flex items-center justify-center font-bold text-xs hover:bg-[#ebe8e3] cursor-pointer"
                        aria-label={`Kurangi ${ci.name}`}
                      >
                        <span className="material-symbols-outlined text-[15px] sm:text-[13px]">remove</span>
                      </button>
                      <span className="w-7 sm:w-6 text-center font-bold text-xs tabular-nums text-[#1c1c19] font-sans">
                        {ci.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(ci.cartItemId, 1)}
                        className="w-7 h-7 sm:w-6 sm:h-6 rounded bg-[#3d1018] text-white flex items-center justify-center font-bold text-xs hover:bg-[#58252c] cursor-pointer"
                        aria-label={`Tambah ${ci.name}`}
                      >
                        <span className="material-symbols-outlined text-[15px] sm:text-[13px]">add</span>
                      </button>
                    </div>

                    <span className="font-bold text-xs text-[#1c1c19] tabular-nums w-16 text-right font-serif">
                      {formatRupiah(ci.totalPrice)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeCartItem(ci.cartItemId)}
                      className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-[#ba1a1a] hover:bg-[#93000a] text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                      aria-label={`Hapus ${ci.name} dari pesanan`}
                    >
                      <span className="material-symbols-outlined text-[17px] sm:text-[16px]">delete</span>
                    </button>
                  </div>
                </div>

                {/* Catatan Item: Tombol Catatan di kiri, status teks di kanan */}
                <div className="flex items-center justify-between text-[11px] pl-1 font-sans">
                  <button
                    type="button"
                    onClick={() => handleOpenNote(ci)}
                    className="text-[11px] font-bold text-[#994703] hover:underline cursor-pointer mr-2 shrink-0"
                  >
                    {ci.customization?.kitchenNotes ? 'Ubah' : '+ Catatan'}
                  </button>
                  <span className="text-[#847374] truncate text-right">
                    {ci.customization?.kitchenNotes
                      ? `Catatan: ${ci.customization.kitchenNotes}`
                      : 'Tanpa catatan khusus'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Catatan Umum Dapur */}
      <div>
        <label htmlFor="customer-kitchen-note-input" className="text-[10px] text-[#847374] block mb-1 font-sans">
          Catatan Umum Dapur (Opsional)
        </label>
        <input
          id="customer-kitchen-note-input"
          type="text"
          value={kitchenGeneralNote}
          onChange={(e) => setKitchenGeneralNote(e.target.value)}
          placeholder="Contoh: Tolong sajikan sambal terpisah..."
          className="w-full px-3 py-1.5 bg-[#fcf9f4] border border-[#ebe8e3] rounded-lg text-xs outline-none focus:border-[#3d1018] font-sans"
        />
      </div>

      {/* Rincian Biaya */}
      <div className="pt-2 border-t border-[#ebe8e3] space-y-1 text-xs font-sans">
        <div className="flex justify-between text-[#847374] text-[11px]">
          <span>Subtotal ({cartCount} item)</span>
          <span className="font-semibold text-[#1c1c19] tabular-nums font-serif">{formatRupiah(cartSubtotal)}</span>
        </div>
        <div className="flex items-baseline justify-between pt-1 border-t border-[#ebe8e3]">
          <span className="font-bold text-xs text-[#524344]">Total Tagihan</span>
          <span className="font-serif text-xl font-bold text-[#3d1018] tabular-nums">
            {formatRupiah(cartTotal)}
          </span>
        </div>
      </div>

      {/* Tombol Kirim Pesanan untuk diverifikasi */}
      <button
        type="button"
        onClick={handleKirimKeDapur}
        disabled={cartItems.length === 0 || isSending}
        className="w-full h-11 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed font-sans"
      >
        {isSending ? (
          <>
            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
            <span>Mengirim Pesanan...</span>
          </>
        ) : (
          <span>Kirim Pesanan untuk diverifikasi</span>
        )}
      </button>
    </>
  );

  return (
    <div className="flex flex-col w-full pt-16 min-h-screen bg-[#fcf9f4] pb-28 lg:pb-12 px-3 sm:px-6 max-w-[1600px] mx-auto">
      {/* Grid Dua Kolom Plek-Ketiplek POS: KIRI (Katalog Menu) & KANAN (Ringkasan Pesanan Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            LEFT AREA: MENU CATALOG (7 Kolom pada Desktop, Full pada Mobile)
           ========================================================================= */}
        <section
          aria-label="Katalog Menu Restoran"
          className="lg:col-span-7 flex flex-col gap-3 w-full"
        >
          {/* Baris Pencarian & Kategori */}
          <div className="flex flex-col gap-2.5 bg-white p-3.5 rounded-xl border border-[#ebe8e3] lg:sticky lg:top-18 lg:z-10 shadow-xs">
            {/* Input Pencarian */}
            <div className="relative flex items-center bg-[#fcf9f4] px-3 py-2 rounded-lg border border-[#ebe8e3] focus-within:border-[#3d1018]">
              <span className="material-symbols-outlined text-[18px] text-[#847374] mr-2">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari rawon, kuah, teh, kopi, pelengkap..."
                className="bg-transparent w-full text-xs sm:text-sm text-[#1c1c19] placeholder-[#847374] outline-none font-sans"
                aria-label="Cari menu"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Bersihkan pencarian"
                  className="text-[#847374] hover:text-[#1c1c19] text-xs cursor-pointer p-0.5"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Filter Kategori Horizontal */}
            <div
              onWheel={(e) => {
                if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
              }}
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 cursor-grab"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`h-8 px-3 rounded-lg text-xs font-bold transition-all shrink-0 inline-flex items-center justify-center cursor-pointer font-sans ${
                    activeCategory === cat
                      ? 'bg-[#3d1018] text-white shadow-xs'
                      : 'bg-[#f0ede9] text-[#524344] hover:bg-[#e0dcd8]'
                  }`}
                >
                  {cat === 'Semua' ? `Semua (${menuItems.length})` : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Daftar Menu List: Desain Ringkas Plek-Ketiplek POS (Tanpa Kotak Inisial/Placeholder) */}
          <div className="bg-white rounded-xl border border-[#ebe8e3] divide-y divide-[#ebe8e3] overflow-y-auto max-h-[calc(100vh-220px)] pr-0.5 shadow-2xs">
            {filteredMenu.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#847374] font-sans">
                Tidak ada menu yang sesuai dengan kata kunci &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredMenu.map((item) => {
                const quantity = cartQtyByMenuId[item.id] || 0;
                const cartEntry = cartItems.find((c) => c.menuItemId === item.id);

                return (
                  <div
                    key={item.id}
                    className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-[#fcf9f4] transition-colors"
                  >
                    {/* Info Menu Kiri (Nama + Favorit + Kategori) */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-[#1c1c19] truncate font-sans">
                          {item.name}
                        </span>
                        {item.badge && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold font-sans">
                            <span className="material-symbols-outlined text-[11px] text-amber-600">star</span>
                            <span>{item.badge.text}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#847374] block truncate mt-0.5 font-sans">
                        {item.category || item.description}
                      </span>
                      {cartEntry?.customization?.kitchenNotes && (
                        <span className="text-[10px] text-[#994703] font-medium block truncate font-sans italic mt-0.5">
                          "{cartEntry.customization.kitchenNotes}"
                        </span>
                      )}
                    </div>

                    {/* Harga & Stepper Kuantitas Kanan */}
                    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                      <span className="font-bold text-xs sm:text-sm text-[#3d1018] tabular-nums font-serif">
                        {formatRupiah(item.price)}
                      </span>

                      {quantity > 0 && cartEntry ? (
                        <div className="flex items-center bg-[#f0ede9] rounded-lg p-0.5 border border-[#e0dcd8]">
                          <button
                            type="button"
                            onClick={() => updateCartItemQty(cartEntry.cartItemId, -1)}
                            className="w-8 h-8 sm:w-7 sm:h-7 rounded bg-white text-[#1c1c19] flex items-center justify-center font-bold text-xs hover:bg-[#ebe8e3] active:scale-95 cursor-pointer shadow-2xs"
                            aria-label={`Kurangi ${item.name}`}
                          >
                            <span className="material-symbols-outlined text-[15px] sm:text-[13px]">remove</span>
                          </button>
                          <span className="w-8 sm:w-7 text-center font-bold text-xs tabular-nums text-[#1c1c19] font-sans">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartItemQty(cartEntry.cartItemId, 1)}
                            className="w-8 h-8 sm:w-7 sm:h-7 rounded bg-[#3d1018] text-white flex items-center justify-center font-bold text-xs hover:bg-[#58252c] active:scale-95 cursor-pointer shadow-2xs"
                            aria-label={`Tambah ${item.name}`}
                          >
                            <span className="material-symbols-outlined text-[15px] sm:text-[13px]">add</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(item, { kuah: 'campur', pedas: '1', sayur: 'lengkap', extras: [] }, 1)}
                          className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-[#3d1018] hover:bg-[#58252c] text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-2xs"
                          aria-label={`Tambahkan ${item.name}`}
                        >
                          <span className="material-symbols-outlined text-[19px] sm:text-[16px]">add</span>
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
            RIGHT AREA: ORDER SUMMARY (5 Kolom hanya pada Desktop lg)
           ========================================================================= */}
        <section
          aria-label="Ringkasan Pesanan Meja"
          className="hidden lg:flex lg:col-span-5 flex-col gap-3.5 bg-white rounded-xl border border-[#ebe8e3] p-4 sm:p-5 sticky top-18 max-h-[calc(100vh-100px)] overflow-y-auto shadow-xs"
        >
          {OrderSummaryContent}
        </section>
      </div>

      {/* =========================================================================
          MOBILE FLOATING CART BAR (Gojek-Style, Melayang di atas Bottom Nav)
         ========================================================================= */}
      {cartCount > 0 && (
        <div className="lg:hidden fixed bottom-16 inset-x-0 z-30 px-3 sm:px-4 pointer-events-none animate-in slide-in-from-bottom-3 duration-200">
          <div className="max-w-md mx-auto pointer-events-auto bg-[#3d1018] text-white p-2.5 sm:p-3 rounded-2xl shadow-xl flex items-center justify-between border border-white/10">
            {/* Sisi Kiri: Badge Total Item & Harga */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-full bg-white text-[#3d1018] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {cartCount}
              </span>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold font-serif tabular-nums text-white truncate">
                  {formatRupiah(cartTotal)}
                </div>
                <div className="text-[10px] text-white/80 font-sans truncate">
                  Meja {selectedTable || '01'} {customerName ? `• ${customerName}` : ''}
                </div>
              </div>
            </div>

            {/* Sisi Kanan: Tombol Buka Sheet Pesanan */}
            <button
              type="button"
              onClick={() => setIsCartSheetOpen(true)}
              className="flex items-center gap-1 text-xs font-bold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 active:scale-95 shadow-2xs font-sans"
            >
              <span>Lihat Pesanan</span>
              <span className="material-symbols-outlined text-[16px]">expand_less</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MOBILE BOTTOM SHEET (Dapat ditarik / swipe ke bawah untuk menutup)
         ========================================================================= */}
      {isCartSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200 touch-none overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCartSheetOpen(false);
          }}
        >
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: sheetTranslateY > 0 ? `translateY(${sheetTranslateY}px)` : undefined,
              transition: isDragging.current ? 'none' : 'transform 0.2s ease-out',
            }}
            className="w-full max-w-md mx-auto bg-white rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl border-t border-[#ebe8e3] animate-in slide-in-from-bottom duration-300 overflow-hidden"
          >
            {/* Drag Handle Bar */}
            <div className="pt-3 pb-1 flex flex-col items-center justify-center shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-[#e0dcd8] rounded-full" />
            </div>

            {/* Header Sheet */}
            <div className="px-4 py-2 border-b border-[#ebe8e3] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-[#1c1c19]">
                  Pesanan Meja {selectedTable || '01'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f0ede9] text-[#524344]">
                  {cartCount} item
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCartSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f0ede9] text-[#524344] hover:text-[#1c1c19] flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Tutup lembar pesanan"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Body Sheet */}
            <div className="overflow-y-auto p-4 flex flex-col gap-3.5 pb-8">
              {OrderSummaryContent}
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Catatan Masak Khusus Per Item */}
      {editingNoteItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl p-4 sm:p-5 w-full max-w-sm shadow-2xl border border-[#ebe8e3] flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e3]">
              <h3 className="font-serif font-bold text-sm text-[#1c1c19]">
                Catatan: {editingNoteItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingNoteItem(null)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[#524344] hover:bg-[#f0ede9]"
                aria-label="Tutup modal"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <label className="text-xs text-[#524344] font-sans">
              Instruksi masak khusus koki:
            </label>

            <input
              type="text"
              value={editingNoteItem.note}
              onChange={(e) => setEditingNoteItem({ ...editingNoteItem, note: e.target.value })}
              placeholder="Contoh: Tidak pedas / Sambal pisah / Less ice..."
              className="w-full h-10 px-3 bg-[#fcf9f4] text-xs text-[#1c1c19] rounded-xl outline-none border border-[#ebe8e3] focus:border-[#3d1018] font-sans"
            />

            <div className="flex flex-wrap gap-1 pt-1 font-sans">
              {['Tidak pedas', 'Pedas sedang', 'Sambal pisah', 'Kuah pisah', 'Less ice'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setEditingNoteItem({ ...editingNoteItem, note: preset })}
                  className="px-2 py-1 rounded-lg bg-[#f0ede9] hover:bg-[#ebe8e3] text-[11px] font-medium text-[#1c1c19] cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2 font-sans">
              <button
                type="button"
                onClick={() => setEditingNoteItem(null)}
                className="flex-1 h-9 rounded-xl bg-[#f0ede9] text-[#1c1c19] text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="flex-1 h-9 rounded-xl bg-[#3d1018] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
