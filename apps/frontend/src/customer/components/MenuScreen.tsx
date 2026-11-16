import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { placeholderImage } from '../../lib/placeholder';
import confetti from 'canvas-confetti';

export const MenuScreen: React.FC = () => {
  const {
    cartItems,
    cartCount,
    cartTotal,
    formatRupiah,
    menuItems,
    menuCategories,
    addToCart,
    updateCartQuantity,
    updateCartItemDetails,
    submitOrder,
    navigate,
    kitchenGeneralNote,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  // Modal edit catatan per item
  const [editingNoteItem, setEditingNoteItem] = useState<{
    cartItemId: string;
    name: string;
    note: string;
  } | null>(null);

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

  return (
    <div className={`flex flex-col w-full pt-14 min-h-screen bg-[#fcf9f4] ${cartCount > 0 ? 'pb-36' : 'pb-20'}`}>
      {/* Baris Pencarian & Kategori Horizontal Sticky */}
      <div className="sticky top-14 z-30 bg-[#fcf9f4]/95 backdrop-blur-md px-4 sm:px-6 pt-3 pb-2.5 border-b border-[#ebe8e3] space-y-2">
        {/* Input Pencarian */}
        <div className="relative flex items-center bg-white px-3.5 py-2 rounded-xl border border-[#ebe8e3] focus-within:border-[#3d1018] shadow-2xs transition-colors">
          <span className="material-symbols-outlined text-[18px] text-[#847374] mr-2">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari menu kesukaan Anda..."
            className="bg-transparent w-full text-xs sm:text-sm text-[#1c1c19] placeholder-[#847374] outline-none font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[#847374] hover:text-[#1c1c19] text-xs cursor-pointer p-0.5"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Filter Kategori Horizontal */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer font-sans ${
                activeCategory === cat
                  ? 'bg-[#3d1018] text-white shadow-xs'
                  : 'bg-white text-[#6b5a5b] hover:bg-[#f0ede9] hover:text-[#1c1c19] border border-[#ebe8e3]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Daftar Menu (Murni Scroll Menu) */}
      <main className="max-w-2xl w-full mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-3xl border border-[#ebe8e3] divide-y divide-[#ebe8e3] overflow-hidden shadow-xs">
          {filteredMenu.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#847374] font-sans">
              Tidak ada menu yang sesuai dengan kata kunci &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredMenu.map((item) => {
              const quantity = cartQtyByMenuId[item.id] || 0;
              const cartItem = cartItems.find((c) => c.menuItemId === item.id);

              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[#fcf9f4] transition-colors"
                >
                  {/* Foto & Info Menu */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-[#f0ede9] border border-[#ebe8e3]">
                      <img
                        src={item.image || placeholderImage(item.name)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = placeholderImage(item.name);
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif font-bold text-xs sm:text-sm text-[#1c1c19] truncate">
                          {item.name}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ffdbc9] text-[#753400] font-bold shrink-0 font-sans">
                            {item.badge.text}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#847374] block truncate font-sans">
                        {item.description || item.category}
                      </span>
                      {cartItem?.customization?.kitchenNotes && (
                        <span className="text-[10px] text-[#994703] font-medium block truncate font-sans italic mt-0.5">
                          "{cartItem.customization.kitchenNotes}"
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Harga & Stepper Kuantitas */}
                  <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                    <span className="font-serif font-extrabold text-xs sm:text-sm text-[#3d1018] tabular-nums">
                      {formatRupiah(item.price)}
                    </span>

                    {quantity > 0 ? (
                      <div className="flex items-center bg-[#f0ede9] rounded-xl p-0.5 border border-[#e0dcd8]">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white text-[#1c1c19] flex items-center justify-center font-bold text-xs hover:bg-[#ebe8e3] active:scale-95 cursor-pointer shadow-2xs"
                          aria-label={`Kurangi ${item.name}`}
                        >
                          <span className="material-symbols-outlined text-[14px]">remove</span>
                        </button>
                        <span className="w-7 text-center font-bold text-xs text-[#1c1c19] tabular-nums font-sans">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-[#3d1018] text-white flex items-center justify-center font-bold text-xs hover:bg-[#58252c] active:scale-95 cursor-pointer shadow-2xs"
                          aria-label={`Tambah ${item.name}`}
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToCart(item, { kuah: 'campur', pedas: '1', sayur: 'lengkap', extras: [] }, 1)}
                        className="w-8 h-8 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-xs"
                        aria-label={`Tambahkan ${item.name}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Floating Bar: Langsung Kirim ke Dapur */}
      {cartCount > 0 && (
        <div className="fixed bottom-16 sm:bottom-18 inset-x-0 z-30 px-4 pointer-events-none pb-safe animate-in slide-in-from-bottom duration-200">
          <div className="w-full max-w-md mx-auto pointer-events-auto bg-[#3d1018] text-white rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3 border border-[#58252c]">
            <div className="flex items-center gap-2.5 min-w-0 pl-1">
              <div className="w-9 h-9 rounded-xl bg-[#994703] flex items-center justify-center text-white shrink-0">
                <span className="material-symbols-outlined text-[18px]">restaurant</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-[#ffdbc9] font-medium font-sans">
                  {cartCount} Menu Dipilih
                </span>
                <span className="font-serif text-sm font-bold tabular-nums">
                  {formatRupiah(cartTotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleKirimKeDapur}
              disabled={isSending}
              className="h-10 px-4 rounded-xl bg-[#994703] hover:bg-[#753400] text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0 shadow-xs"
            >
              {isSending ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <span>Kirim ke Dapur</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal Edit Catatan Per-Item */}
      {editingNoteItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-modal-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingNoteItem(null);
          }}
        >
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl flex flex-col gap-3 border border-[#ebe8e3]">
            <div className="flex items-center justify-between border-b border-[#ebe8e3] pb-2">
              <h3 id="note-modal-title" className="font-serif font-bold text-sm text-[#3d1018]">
                Catatan: {editingNoteItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingNoteItem(null)}
                className="w-6 h-6 rounded-full bg-[#f0ede9] flex items-center justify-center text-[#524344] cursor-pointer"
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
