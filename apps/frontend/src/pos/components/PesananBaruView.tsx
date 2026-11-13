import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem } from '../types';

export const PesananBaruView: React.FC = () => {
  const {
    menuItems,
    menuCategories,
    cartItems,
    orderTableNumber,
    setOrderTableNumber,
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
    saveDraftOrder,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccessSent, setIsSuccessSent] = useState(false);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'summary'>('catalog');

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
    if (activeCategory === 'Favorit') return !!item.isFavorite;
    return item.category === activeCategory;
  });

  // Kalkulasi total biaya pesanan
  const subtotal = cartItems.reduce((acc, curr) => acc + curr.menuItem.price * curr.quantity, 0);
  const totalItemCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  const serviceCharge = Math.round(subtotal * 0.05); // 5% Biaya Layanan
  const pb1Tax = Math.round((subtotal + serviceCharge) * 0.1); // 10% Pajak Daerah PB1
  const grandTotal = subtotal + serviceCharge + pb1Tax;

  const handleKirimKitchen = () => {
    if (cartItems.length === 0) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsSuccessSent(true);
      sendOrderToKitchen();
      setTimeout(() => {
        setIsSuccessSent(false);
        setMobileTab('catalog');
      }, 1500);
    }, 400);
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

  return (
    <div className="flex flex-col w-full pb-20 md:pb-8 max-w-[1600px] mx-auto px-4 sm:px-6 pt-3">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-[#ebe8e3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1c1c19] tracking-tight">
            Pesanan Baru
          </h1>
        </div>

        {/* Mobile Switcher Tab (Menu vs Ringkasan Pesanan) */}
        <div className="flex items-center lg:hidden bg-[#f0ede9] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMobileTab('catalog')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              mobileTab === 'catalog' ? 'bg-white text-[#3d1018] shadow-xs' : 'text-[#524344]'
            }`}
          >
            Katalog Menu
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('summary')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'summary' ? 'bg-white text-[#3d1018] shadow-xs' : 'text-[#524344]'
            }`}
          >
            <span>Pesanan</span>
            {totalItemCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#3d1018] text-white">
                {totalItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Grid Dua Kolom: KIRI (Katalog Menu) & KANAN (Ringkasan Pesanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            LEFT AREA: MENU CATALOG (7 Kolom pada Desktop)
           ========================================================================= */}
        <section
          aria-label="Katalog Menu Restoran"
          className={`lg:col-span-7 flex flex-col gap-3 ${
            mobileTab === 'summary' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Baris Pencarian & Kategori */}
          <div className="flex flex-col gap-2.5 bg-white p-3.5 rounded-xl border border-[#ebe8e3] lg:sticky lg:top-20 lg:z-10 shadow-xs">
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
                  className="text-[#847374] hover:text-[#1c1c19] text-xs"
                  aria-label="Hapus kata kunci"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Filter Kategori Horizontal */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => setActiveCategory('Semua')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeCategory === 'Semua'
                    ? 'bg-[#3d1018] text-white'
                    : 'bg-[#f0ede9] text-[#524344] hover:bg-[#e0dcd8]'
                }`}
              >
                Semua ({menuItems.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('Favorit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                  activeCategory === 'Favorit'
                    ? 'bg-[#3d1018] text-white'
                    : 'bg-[#f0ede9] text-[#524344] hover:bg-[#e0dcd8]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">star</span>
                <span>Favorit</span>
              </button>

              {menuCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#3d1018] text-white'
                      : 'bg-[#f0ede9] text-[#524344] hover:bg-[#e0dcd8]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Daftar Menu: Compact Horizontal List dengan scroll mandiri */}
          <div className="bg-white rounded-xl border border-[#ebe8e3] divide-y divide-[#ebe8e3] overflow-y-auto max-h-[calc(100vh-270px)] pr-0.5">
            {filteredMenu.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#847374]">
                Tidak ada menu yang sesuai dengan kata kunci &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredMenu.map((item) => {
                const cartEntry = cartItems.find((ci) => ci.menuItem.id === item.id);
                const quantity = cartEntry ? cartEntry.quantity : 0;

                return (
                  <div
                    key={item.id}
                    className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-[#fcf9f4] transition-colors"
                  >
                    {/* Info Menu Kiri (Foto Kecil Opsional + Nama + Kategori) */}
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[#f0ede9] border border-[#ebe8e3]">
                          <img
                            src={item.image}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-[#1c1c19] truncate">
                            {item.name}
                          </span>
                          {item.isFavorite && (
                            <span
                              className="material-symbols-outlined text-[14px] text-[#994703] shrink-0"
                              aria-hidden="true"
                            >
                              star
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#847374] block truncate">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* Harga & Tombol Tambah Kanan */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-xs sm:text-sm text-[#3d1018] tabular-nums">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>

                      {quantity > 0 ? (
                        <div className="flex items-center bg-[#f0ede9] rounded-lg p-0.5 border border-[#e0dcd8]">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="w-7 h-7 rounded bg-white text-[#1c1c19] flex items-center justify-center font-bold text-xs hover:bg-[#ebe8e3] cursor-pointer"
                            aria-label={`Kurangi ${item.name}`}
                          >
                            <span className="material-symbols-outlined text-[14px]">remove</span>
                          </button>
                          <span className="w-7 text-center font-bold text-xs text-[#1c1c19] tabular-nums">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="w-7 h-7 rounded bg-[#3d1018] text-white flex items-center justify-center font-bold text-xs hover:bg-[#58252c] cursor-pointer"
                            aria-label={`Tambah ${item.name}`}
                          >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(item, 1)}
                          className="w-8 h-8 rounded-lg bg-[#3d1018] hover:bg-[#58252c] text-white flex items-center justify-center transition-colors cursor-pointer"
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
        </section>

        {/* =========================================================================
            RIGHT AREA: ORDER SUMMARY (5 Kolom pada Desktop)
           ========================================================================= */}
        <section
          aria-label="Ringkasan Pesanan Meja"
          className={`lg:col-span-5 flex flex-col gap-3.5 bg-white rounded-xl border border-[#ebe8e3] p-4 sm:p-5 lg:sticky lg:top-20 max-h-[calc(100vh-100px)] overflow-y-auto ${
            mobileTab === 'catalog' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Selector Meja & Pelanggan (Compact Horizontal Grid) */}
          <div className="pb-3 border-b border-[#ebe8e3] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#524344]">
                Target Meja &amp; Tamu
              </span>
              <button
                type="button"
                onClick={saveDraftOrder}
                className="text-xs font-semibold text-[#994703] hover:text-[#753400] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">bookmark</span>
                <span>Simpan Draf</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Dropdown Meja */}
              <div>
                <label htmlFor="order-table" className="text-[10px] text-[#847374] block mb-0.5">
                  No. Meja
                </label>
                <select
                  id="order-table"
                  value={orderTableNumber}
                  onChange={(e) => setOrderTableNumber(e.target.value)}
                  className="w-full bg-[#fcf9f4] border border-[#ebe8e3] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#1c1c19] outline-none cursor-pointer focus:border-[#3d1018]"
                >
                  {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(
                    (num) => (
                      <option key={num} value={num}>
                        Meja {num}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Input Nama Tamu */}
              <div>
                <label htmlFor="order-customer" className="text-[10px] text-[#847374] block mb-0.5">
                  Nama Tamu
                </label>
                <input
                  id="order-customer"
                  type="text"
                  value={orderCustomerName}
                  onChange={(e) => setOrderCustomerName(e.target.value)}
                  placeholder="Opsional..."
                  className="w-full bg-[#fcf9f4] border border-[#ebe8e3] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#1c1c19] outline-none focus:border-[#3d1018]"
                />
              </div>

              {/* Selector Pax Tamu */}
              <div>
                <label htmlFor="order-guests" className="text-[10px] text-[#847374] block mb-0.5">
                  Jumlah Pax
                </label>
                <select
                  id="order-guests"
                  value={orderGuestCount}
                  onChange={(e) => setOrderGuestCount(parseInt(e.target.value, 10))}
                  className="w-full bg-[#fcf9f4] border border-[#ebe8e3] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#1c1c19] outline-none cursor-pointer focus:border-[#3d1018]"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                    <option key={num} value={num}>
                      {num} Pax
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
                Pilih menu dari daftar di sebelah kiri untuk mulai memesan.
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
                            className="w-6 h-6 rounded bg-white text-[#1c1c19] flex items-center justify-center font-bold text-xs hover:bg-[#ebe8e3] cursor-pointer"
                            aria-label={`Kurangi ${ci.menuItem.name}`}
                          >
                            <span className="material-symbols-outlined text-[13px]">remove</span>
                          </button>
                          <span className="w-6 text-center font-bold text-xs tabular-nums">
                            {ci.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(ci.menuItem.id, 1)}
                            className="w-6 h-6 rounded bg-[#3d1018] text-white flex items-center justify-center font-bold text-xs hover:bg-[#58252c] cursor-pointer"
                            aria-label={`Tambah ${ci.menuItem.name}`}
                          >
                            <span className="material-symbols-outlined text-[13px]">add</span>
                          </button>
                        </div>

                        <span className="font-bold text-xs text-[#1c1c19] tabular-nums w-16 text-right">
                          Rp {(ci.menuItem.price * ci.quantity).toLocaleString('id-ID')}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFromCart(ci.menuItem.id)}
                          className="text-[#847374] hover:text-[#ba1a1a] p-1 cursor-pointer"
                          aria-label={`Hapus ${ci.menuItem.name} dari pesanan`}
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Catatan Item */}
                    <div className="flex items-center justify-between text-[11px] pl-1">
                      <span className="text-[#847374] truncate">
                        {ci.notes ? `Catatan: ${ci.notes}` : 'Tanpa catatan khusus'}
                      </span>
                      <button
                        type="button"
                        onClick={() => openNoteEditor(ci.menuItem, ci.notes)}
                        className="text-[#994703] font-semibold hover:underline shrink-0 ml-2 cursor-pointer"
                      >
                        {ci.notes ? 'Ubah Catatan' : '+ Catatan'}
                      </button>
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
            <div className="flex justify-between text-[#524344]">
              <span>Biaya Layanan (5%)</span>
              <span className="font-medium text-[#1c1c19] tabular-nums">
                Rp {serviceCharge.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-[#524344]">
              <span>Pajak Daerah PB1 (10%)</span>
              <span className="font-medium text-[#1c1c19] tabular-nums">
                Rp {pb1Tax.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#ebe8e3] items-baseline">
              <span className="text-sm font-bold text-[#1c1c19]">TOTAL</span>
              <span className="text-xl font-bold text-[#3d1018] tabular-nums">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Tombol Tindakan */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleKirimKitchen}
              disabled={isSending || cartItems.length === 0}
              className={`w-full py-3 px-4 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                isSuccessSent
                  ? 'bg-emerald-700'
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
                <>
                  <span className="material-symbols-outlined text-[18px]">soup_kitchen</span>
                  <span>Kirim ke Kitchen (Rp {grandTotal.toLocaleString('id-ID')})</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>

      {/* Modal Edit Catatan Menu */}
      {editingNoteItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-modal-title"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl flex flex-col gap-3 border border-[#ebe8e3]">
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
