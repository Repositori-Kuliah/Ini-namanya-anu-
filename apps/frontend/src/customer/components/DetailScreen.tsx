import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { placeholderImage } from '../../lib/placeholder';

export const DetailScreen: React.FC = () => {
  const {
    selectedMenuItem,
    editingCartItem,
    selectedTable,
    addToCart,
    updateCartItemDetails,
    clearEditingCartItem,
    navigate,
    formatRupiah,
    extraOptions,
  } = useApp();

  const item = selectedMenuItem;
  const isEditing = Boolean(editingCartItem && editingCartItem.menuItemId === item.id);

  // Form selections (initialize from editingCartItem when editing)
  const [kuah, setKuah] = useState<'campur' | 'pisah'>(
    isEditing ? editingCartItem!.customization.kuah || 'campur' : 'campur'
  );
  const [pedas, setPedas] = useState<'0' | '1' | '2'>(
    isEditing ? editingCartItem!.customization.pedas || '1' : '1'
  );
  const [selectedExtras, setSelectedExtras] = useState<string[]>(
    isEditing ? editingCartItem!.customization.extras || [] : []
  );
  const [kitchenNote, setKitchenNote] = useState<string>(
    isEditing ? editingCartItem!.customization.kitchenNotes || '' : ''
  );
  const [quantity, setQuantity] = useState<number>(
    isEditing ? editingCartItem!.quantity : 1
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync form when switching selectedMenuItem / editingCartItem
  useEffect(() => {
    if (editingCartItem && editingCartItem.menuItemId === item.id) {
      setKuah(editingCartItem.customization.kuah || 'campur');
      setPedas(editingCartItem.customization.pedas || '1');
      setSelectedExtras(editingCartItem.customization.extras || []);
      setKitchenNote(editingCartItem.customization.kitchenNotes || '');
      setQuantity(editingCartItem.quantity || 1);
    } else {
      setKuah('campur');
      setPedas('1');
      setSelectedExtras([]);
      setKitchenNote('');
      setQuantity(1);
    }
  }, [item.id, editingCartItem]);

  // Extras cost calculation
  const extrasCost = useMemo(() => {
    return selectedExtras.reduce((sum, extraName) => {
      const match = extraOptions.find((opt) => opt.name === extraName);
      return sum + (match ? match.price : 0);
    }, 0);
  }, [selectedExtras, extraOptions]);

  const portionPrice = item.price + extrasCost;
  const grandTotalPrice = portionPrice * quantity;

  const toggleExtra = (extraName: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extraName) ? prev.filter((e) => e !== extraName) : [...prev, extraName]
    );
  };

  const handleSaveToTable = () => {
    setIsSubmitting(true);
    const customization = {
      kuah,
      pedas,
      sayur: 'lengkap' as const,
      extras: selectedExtras,
      kitchenNotes: kitchenNote,
    };

    if (isEditing && editingCartItem) {
      updateCartItemDetails(editingCartItem.cartItemId, item, customization, quantity);
      setIsSubmitting(false);
      navigate('cart');
      return;
    }

    addToCart(item, customization, quantity);
    setTimeout(() => {
      setIsSubmitting(false);
      clearEditingCartItem();
      navigate('menu');
    }, 200);
  };

  const heroImageSrc = item.heroImage || item.image;

  return (
    <div className="flex flex-col w-full pt-16 bg-[#fcf9f4] min-h-screen">
      <div className="flex-1 px-4 md:px-6 pt-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {/* Left Column: Photo + Title & Description */}
          <div className="md:col-span-5 md:sticky md:top-20 space-y-4">
            <div className="relative w-full h-56 sm:h-64 md:h-72 rounded-2xl overflow-hidden bg-[#f6f3ee] border border-[#ebe8e3] shadow-xs">
              <img
                src={heroImageSrc}
                alt={item.name}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.dataset.fallbackApplied) {
                    img.dataset.fallbackApplied = '1';
                    img.src = placeholderImage(item.name);
                  }
                }}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#ebe8e3] shadow-xs space-y-2">
              {item.badge && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#994703]">
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
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#3d1018] leading-tight">
                  {item.name}
                </h2>
                <span className="font-serif text-lg sm:text-xl text-[#3d1018] font-bold tabular-nums shrink-0">
                  {formatRupiah(item.price)}
                </span>
              </div>
              <p className="text-xs text-[#524344] leading-relaxed">
                {item.longDescription || item.description}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-[#847374]">
                <span className="font-semibold text-[#1c1c19]">{item.category}</span>
                <span aria-hidden="true">·</span>
                <span>Resep Warisan 1982</span>
              </div>
            </div>
          </div>

          {/* Right Column: Customization Form */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="md:col-span-7 flex flex-col gap-4"
          >
            {/* Option 1: Pilihan Kuah */}
            <fieldset className="bg-white p-4 rounded-2xl flex flex-col gap-3 shadow-xs border border-[#ebe8e3]">
              <legend className="font-serif font-bold text-sm text-[#1c1c19] px-1">
                Penyajian Kuah{' '}
                <span className="text-xs font-sans font-semibold text-[#994703]">(Wajib)</span>
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label
                  className={`flex items-center justify-between gap-2 p-3.5 min-h-[52px] rounded-xl cursor-pointer transition-colors border ${
                    kuah === 'campur'
                      ? 'bg-[#f0ede9] border-[#3d1018]'
                      : 'bg-white border-[#ebe8e3] hover:bg-[#f6f3ee]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="radio"
                      name="kuah-option"
                      value="campur"
                      checked={kuah === 'campur'}
                      onChange={() => setKuah('campur')}
                      className="w-4 h-4 accent-[#3d1018] shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-[#1c1c19] block">
                        Kuah Dicampur
                      </span>
                      <span className="text-[11px] text-[#524344] block">
                        Disajikan hangat langsung
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#524344] shrink-0">Bawaan</span>
                </label>

                <label
                  className={`flex items-center justify-between gap-2 p-3.5 min-h-[52px] rounded-xl cursor-pointer transition-colors border ${
                    kuah === 'pisah'
                      ? 'bg-[#f0ede9] border-[#3d1018]'
                      : 'bg-white border-[#ebe8e3] hover:bg-[#f6f3ee]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="radio"
                      name="kuah-option"
                      value="pisah"
                      checked={kuah === 'pisah'}
                      onChange={() => setKuah('pisah')}
                      className="w-4 h-4 accent-[#3d1018] shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-[#1c1c19] block">
                        Kuah Dipisah
                      </span>
                      <span className="text-[11px] text-[#524344] block">
                        Mangkuk kuah terpisah
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#524344] shrink-0">Gratis</span>
                </label>
              </div>
            </fieldset>

            {/* Option 2: Tingkat Pedas */}
            <fieldset className="bg-white p-4 rounded-2xl flex flex-col gap-3 shadow-xs border border-[#ebe8e3]">
              <legend className="font-serif font-bold text-sm text-[#1c1c19] px-1">
                Tingkat Pedas Sambal Terasi{' '}
                <span className="text-xs font-sans font-semibold text-[#994703]">(Wajib)</span>
              </legend>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '0' as const, title: 'Tidak Pedas', sub: 'Tanpa sambal' },
                  { id: '1' as const, title: 'Sedang', sub: 'Rekomendasi' },
                  { id: '2' as const, title: 'Pedas Mantap', sub: 'Ekstra cabai' },
                ].map((opt) => {
                  const selected = pedas === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPedas(opt.id)}
                      aria-pressed={selected}
                      className={`min-h-[52px] flex flex-col items-center justify-center p-2.5 rounded-xl text-center transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none ${
                        selected
                          ? 'bg-[#3d1018] text-white shadow-xs'
                          : 'bg-[#f6f3ee] text-[#1c1c19] hover:bg-[#ebe8e3] border border-[#ebe8e3]'
                      }`}
                    >
                      <span className="font-bold text-xs">{opt.title}</span>
                      <span
                        className={`text-[10px] mt-0.5 ${
                          selected ? 'text-[#ffdbc9]' : 'text-[#524344]'
                        }`}
                      >
                        {opt.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Option 3: Extras */}
            {extraOptions.length > 0 && (
              <fieldset className="bg-white p-4 rounded-2xl flex flex-col gap-3 shadow-xs border border-[#ebe8e3]">
                <legend className="font-serif font-bold text-sm text-[#1c1c19] px-1">
                  Topping &amp; Lauk Pendamping{' '}
                  <span className="text-xs font-sans font-semibold text-[#524344]">(Opsional)</span>
                </legend>

                <div className="flex flex-col gap-2">
                  {extraOptions.map((extra) => {
                    const isChecked = selectedExtras.includes(extra.name);
                    return (
                      <label
                        key={extra.id}
                        className={`flex items-center justify-between gap-3 p-3.5 min-h-[52px] rounded-xl cursor-pointer transition-colors border ${
                          isChecked
                            ? 'bg-[#f0ede9] border-[#3d1018]'
                            : 'bg-white border-[#ebe8e3] hover:bg-[#f6f3ee]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleExtra(extra.name)}
                            className="w-4 h-4 accent-[#3d1018] rounded shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-[#1c1c19] block">
                              {extra.name}
                            </span>
                            {extra.description && (
                              <span className="text-[11px] text-[#524344] block">
                                {extra.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-xs text-[#3d1018] tabular-nums shrink-0">
                          +{formatRupiah(extra.price)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {/* Option 4: Catatan Khusus */}
            <div className="bg-white p-4 rounded-2xl flex flex-col gap-2 shadow-xs border border-[#ebe8e3]">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="detail-kitchen-note"
                  className="font-serif font-bold text-sm text-[#1c1c19]"
                >
                  Catatan Khusus Dapur
                </label>
                <span className="text-[11px] text-[#847374] tabular-nums">
                  {kitchenNote.length}/100
                </span>
              </div>
              <textarea
                id="detail-kitchen-note"
                value={kitchenNote}
                onChange={(e) => setKitchenNote(e.target.value)}
                placeholder="Contoh: Tauge dipisah, kuah hangat, tanpa daun bawang..."
                rows={2}
                maxLength={100}
                className="w-full bg-[#fcf9f4] text-[#1c1c19] placeholder:text-[#847374] text-xs p-3 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#3d1018] border border-[#ebe8e3]"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Sticky Bottom Purchase Bar */}
      <div className="sticky bottom-0 z-30 bg-[#fcf9f4]/95 backdrop-blur-md border-t border-[#ebe8e3] px-4 md:px-6 py-3 pb-safe shadow-[0_-4px_16px_rgba(61,16,24,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start sm:gap-5">
            <div className="flex flex-col">
              <span className="text-[11px] text-[#524344]">Harga per Porsi</span>
              <span className="font-serif text-base font-bold text-[#3d1018] tabular-nums">
                {formatRupiah(portionPrice)}
              </span>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-[#ebe8e3] shadow-xs">
              <button
                type="button"
                aria-label="Kurangi jumlah porsi"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-lg bg-[#f0ede9] text-[#1c1c19] flex items-center justify-center hover:bg-[#ebe8e3] disabled:opacity-35 transition-colors focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  remove
                </span>
              </button>
              <span
                aria-live="polite"
                className="font-bold text-base text-[#3d1018] min-w-[26px] text-center tabular-nums"
              >
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Tambah jumlah porsi"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-lg bg-[#3d1018] text-white flex items-center justify-center hover:bg-[#58252c] transition-colors focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  add
                </span>
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSaveToTable}
            aria-label={
              isEditing
                ? `Simpan perubahan dengan total ${formatRupiah(grandTotalPrice)}`
                : `Simpan ke Meja ${selectedTable} dengan total ${formatRupiah(grandTotalPrice)}`
            }
            className="w-full sm:w-auto sm:min-w-[260px] h-12 rounded-xl bg-[#3d1018] text-white hover:bg-[#58252c] active:scale-[0.99] transition-all flex items-center justify-between gap-4 px-4 font-bold text-sm shadow-sm cursor-pointer disabled:opacity-80 focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
          >
            <span>{isEditing ? 'Simpan Perubahan' : `Simpan ke Meja ${selectedTable}`}</span>
            <span className="font-serif text-base tabular-nums">
              {formatRupiah(grandTotalPrice)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
