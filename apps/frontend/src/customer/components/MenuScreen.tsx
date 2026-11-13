import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem } from '../types';
import { CustomizationModal } from './CustomizationModal';
import { placeholderImage } from '../../lib/placeholder';
import foodRawonImg from '../../assets/images/food_rawon_daging_signature_1794405798486.jpg';

export const MenuScreen: React.FC = () => {
  const {
    selectedTable,
    tableArea,
    cartItems,
    cartCount,
    cartTotal,
    quickAddToCart,
    openDetail,
    navigate,
    callWaiter,
    waiterCalled,
    waiterCooldown,
    formatRupiah,
    menuItems,
    menuCategories,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  const categories = useMemo(
    () => [
      { id: 'all', label: 'Semua Menu' },
      ...menuCategories.filter((c) => menuItems.some((m) => m.category === c.id)),
    ],
    [menuCategories, menuItems]
  );

  // Map per-item total quantity currently in cart
  const cartQtyByMenuId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of cartItems) {
      map[c.menuItemId] = (map[c.menuItemId] || 0) + c.quantity;
    }
    return map;
  }, [cartItems]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchesCategory =
        activeCategory === 'all' || item.categories.includes(activeCategory);
      const matchesSearch =
        q === '' ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, menuItems]);

  const featured = menuItems.find((m) => m.badge?.type === 'best_seller') || menuItems[0];

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>, name: string) => {
    const img = e.currentTarget;
    if (img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = '1';
    img.src = placeholderImage(name);
  };

  return (
    <div
      className={`flex flex-col w-full pt-16 bg-[#fcf9f4] min-h-screen ${
        cartCount > 0 ? 'pb-36' : 'pb-24'
      }`}
    >
      {/* Table Location & Call Waiter Action Card */}
      <section className="px-4 md:px-6 pt-3" aria-label="Status Meja & Pelayan">
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3 border border-[#ebe8e3]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#f6f3ee] text-[#3d1018] flex items-center justify-center shrink-0 border border-[#ebe8e3]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                table_restaurant
              </span>
            </div>
            <div className="min-w-0">
              <span className="font-serif font-bold text-sm text-[#1c1c19] block">
                Meja {selectedTable}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={callWaiter}
            aria-label={waiterCalled ? 'Pelayan sedang dipanggil' : 'Panggil pelayan ke meja'}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none text-xs font-semibold ${
              waiterCooldown > 0
                ? 'bg-[#ffdbc9] text-[#753400] border border-[#fc934f]'
                : 'bg-[#f0ede9] text-[#3d1018] hover:bg-[#ebe8e3] border border-[#ebe8e3]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              {waiterCooldown > 0 ? 'hourglass_top' : 'notifications_active'}
            </span>
            <span className="whitespace-nowrap tabular-nums">
              {waiterCooldown > 0 ? `Dipanggil (${waiterCooldown}d)` : 'Panggil Pelayan'}
            </span>
          </button>
        </div>
      </section>

      {/* Search Bar & Category Filter */}
      <div className="px-4 md:px-6 pt-3 space-y-3">
        <section aria-label="Pencarian Menu">
          <div className="relative w-full">
            <label htmlFor="menu-search-input" className="sr-only">
              Cari menu makanan atau minuman
            </label>
            <span
              className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#524344] text-[20px]"
              aria-hidden="true"
            >
              search
            </span>
            <input
              id="menu-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari rawon, empal, sambal, minuman..."
              type="search"
              className="w-full h-11 pl-11 pr-12 rounded-xl bg-white text-[#1c1c19] text-xs font-medium placeholder:text-[#847374] border border-[#ebe8e3] focus:outline-none focus:ring-2 focus:ring-[#3d1018] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus kata kunci pencarian"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-[#524344] hover:text-[#1c1c19] min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  close
                </span>
              </button>
            )}
          </div>
        </section>

        {/* Category Filter Buttons */}
        <section aria-label="Kategori Menu" className="-mx-4 md:-mx-6">
          <div className="flex items-center gap-2 overflow-x-auto px-4 md:px-6 pb-1 no-scrollbar">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  aria-pressed={isActive}
                  className={`whitespace-nowrap min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none ${
                    isActive
                      ? 'bg-[#3d1018] text-white shadow-xs'
                      : 'bg-white text-[#524344] hover:text-[#1c1c19] hover:bg-[#f6f3ee] border border-[#ebe8e3]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Featured Editorial Highlight Card */}
      {activeCategory === 'all' && !searchQuery && featured && (
        <section className="px-4 md:px-6 pt-3" aria-label="Menu Unggulan">
          <button
            type="button"
            onClick={() => openDetail(featured)}
            className="w-full text-left bg-[#3d1018] hover:bg-[#58252c] text-white rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-sm border border-[#58252c] cursor-pointer group transition-colors focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
          >
            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="text-[10px] font-bold text-[#fc934f] uppercase tracking-widest block">
                Resep Warisan 1982
              </span>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-white leading-tight truncate">
                {featured.name}
              </h2>
              <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">
                {featured.description}
              </p>
              <div className="pt-1 flex items-center gap-3">
                <span className="font-serif font-bold text-base text-[#ffdbc9] tabular-nums">
                  {formatRupiah(featured.price)}
                </span>
                <span className="text-[11px] font-semibold text-white/85 inline-flex items-center gap-1">
                  Lihat &amp; Atur Opsi
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                    chevron_right
                  </span>
                </span>
              </div>
            </div>

            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-black/20 shrink-0 border border-white/15">
              <img
                src={featured.image || foodRawonImg}
                alt={featured.name}
                onError={(e) => handleImgError(e, featured.name)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
          </button>
        </section>
      )}

      {/* Menu Catalog Grid */}
      <section className="px-4 md:px-6 pt-4" aria-label="Daftar Menu Makanan dan Minuman">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => {
            const qtyInCart = cartQtyByMenuId[item.id] || 0;
            return (
              <article
                key={item.id}
                className="bg-white rounded-2xl p-4 shadow-xs border border-[#ebe8e3] flex flex-col justify-between gap-3 hover:border-[#d7c2c2] transition-colors"
              >
                <div className="flex gap-3.5">
                  {/* Thumbnail */}
                  <button
                    type="button"
                    onClick={() => openDetail(item)}
                    aria-label={`Lihat detail ${item.name}`}
                    className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-[#f6f3ee] border border-[#ebe8e3] cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(e) => handleImgError(e, item.name)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </button>

                  {/* Item Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <button
                      type="button"
                      onClick={() => openDetail(item)}
                      className="text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none rounded-md"
                    >
                      {item.badge && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#994703] mb-0.5">
                          <span
                            className="material-symbols-outlined text-[13px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                            aria-hidden="true"
                          >
                            {item.badge.type === 'best_seller' ? 'star' : 'favorite'}
                          </span>
                          <span>{item.badge.text}</span>
                        </span>
                      )}
                      <h3 className="font-serif font-bold text-base text-[#1c1c19] leading-snug line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#524344] line-clamp-2 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </button>

                    <div className="pt-1.5 flex items-baseline justify-between gap-2">
                      <span className="font-serif font-bold text-base text-[#3d1018] tabular-nums">
                        {formatRupiah(item.price)}
                      </span>
                      {qtyInCart > 0 && (
                        <span className="text-[11px] font-bold text-[#994703] tabular-nums">
                          {qtyInCart} di keranjang
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Category & Actions */}
                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#f0ede9]">
                  <span className="text-xs text-[#524344] font-medium truncate">
                    {item.category}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openDetail(item)}
                      aria-label={`Atur opsi ${item.name}`}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-[#f0ede9] text-[#1c1c19] hover:bg-[#ebe8e3] text-xs font-semibold active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
                    >
                      Pilih Opsi
                    </button>
                    <button
                      type="button"
                      onClick={() => quickAddToCart(item)}
                      aria-label={`Tambah ${item.name} ke keranjang`}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#3d1018] text-white hover:bg-[#58252c] text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
                    >
                      <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                        add
                      </span>
                      <span>Tambah</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#ebe8e3] text-center py-12 px-4 text-[#524344]">
            <span
              className="material-symbols-outlined text-4xl mb-2 text-[#847374]"
              aria-hidden="true"
            >
              search_off
            </span>
            <p className="font-serif font-bold text-base text-[#1c1c19]">
              Menu tidak ditemukan
            </p>
            <p className="text-xs text-[#524344] mt-1">
              Tidak ada hidangan yang cocok dengan kata kunci atau kategori ini.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-[#f0ede9] text-[#3d1018] hover:bg-[#ebe8e3] text-xs font-bold cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none transition-colors"
            >
              Tampilkan Semua Menu
            </button>
          </div>
        )}
      </section>

      {/* Sticky Floating Bottom Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-18 left-0 right-0 z-30 px-4 pointer-events-none pb-safe">
          <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl mx-auto pointer-events-auto bg-[#3d1018] text-white rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3 border border-[#58252c]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-10 h-10 rounded-xl bg-[#994703] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  shopping_basket
                </span>
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-white text-[#3d1018] rounded-full text-[10px] font-extrabold leading-none flex items-center justify-center tabular-nums">
                  {cartCount}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-white/80 font-medium truncate">
                  {cartCount} Porsi di Keranjang
                </span>
                <span className="font-serif text-base text-white font-bold tabular-nums">
                  {formatRupiah(cartTotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('cart')}
              aria-label="Lihat keranjang pesanan"
              className="bg-[#994703] hover:bg-[#753400] text-white min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <span>Lihat Pesanan</span>
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Customization Drawer Modal (retained for quick modal triggers if needed) */}
      {customizingItem && (
        <CustomizationModal
          isOpen={!!customizingItem}
          onClose={() => setCustomizingItem(null)}
          item={customizingItem}
        />
      )}
    </div>
  );
};
