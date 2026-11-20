import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { placeholderImage } from '../../lib/placeholder';

export const DetailScreen: React.FC = () => {
  const {
    selectedMenuItem,
    editingCartItem,
    addToCart,
    updateCartItemDetails,
    clearEditingCartItem,
    navigate,
    formatRupiah,
    extraOptions,
  } = useApp();

  const item = selectedMenuItem;
  const isEditing = Boolean(editingCartItem && editingCartItem.menuItemId === item.id);

  const [kuah, setKuah] = useState<'campur' | 'pisah'>('campur');
  const [pedas, setPedas] = useState<'0' | '1' | '2'>('1');
  const [sayur, setSayur] = useState<'lengkap' | 'pisah'>('lengkap');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [kitchenNote, setKitchenNote] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (editingCartItem && editingCartItem.menuItemId === item.id) {
      setKuah(editingCartItem.customization.kuah || 'campur');
      setPedas(editingCartItem.customization.pedas || '1');
      setSayur(editingCartItem.customization.sayur || 'lengkap');
      setSelectedExtras(editingCartItem.customization.extras || []);
      setKitchenNote(editingCartItem.customization.kitchenNotes || '');
      setQuantity(editingCartItem.quantity || 1);
    } else {
      setKuah('campur');
      setPedas('1');
      setSayur('lengkap');
      setSelectedExtras([]);
      setKitchenNote('');
      setQuantity(1);
    }
  }, [item.id, editingCartItem]);

  const extrasCost = useMemo(() => {
    return selectedExtras.reduce((sum, extraName) => {
      const match = extraOptions.find((opt) => opt.name === extraName);
      return sum + (match ? match.price : 0);
    }, 0);
  }, [selectedExtras, extraOptions]);

  const totalCost = (item.price + extrasCost) * quantity;

  const toggleExtra = (extraName: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extraName) ? prev.filter((e) => e !== extraName) : [...prev, extraName]
    );
  };

  const handleSave = () => {
    const customization = {
      kuah,
      pedas,
      sayur,
      extras: selectedExtras,
      kitchenNotes: kitchenNote.trim() || undefined,
    };

    if (isEditing && editingCartItem) {
      updateCartItemDetails(editingCartItem.cartItemId, item, customization, quantity);
      navigate('cart');
      return;
    }

    addToCart(item, customization, quantity);
    clearEditingCartItem();
    navigate('menu');
  };

  return (
    <div className="flex flex-col w-full pt-16 pb-28 min-h-screen bg-neutral-50">
      <div className="px-4 md:px-6 py-4 max-w-xl mx-auto w-full space-y-5">
        {/* Foto & Detail Utama */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-2xs space-y-4">
          <div className="aspect-16/10 w-full rounded-2xl overflow-hidden bg-neutral-100">
            <img
              src={item.image || placeholderImage(item.name)}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = placeholderImage(item.name);
              }}
            />
          </div>

          <div>
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              {item.category || 'Menu Pilihan'}
            </span>
            <h2 className="text-xl font-extrabold text-neutral-900 mt-0.5">
              {item.name}
            </h2>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              {item.description}
            </p>
            <div className="text-base font-black text-neutral-950 mt-2">
              {formatRupiah(item.price)}
            </div>
          </div>
        </div>

        {/* Pilihan Kuah & Pedas */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-2xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
              Penyajian Kuah
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'campur' as const, label: 'Kuah Dicampur' },
                { id: 'pisah' as const, label: 'Kuah Dipisah' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setKuah(opt.id)}
                  className={`p-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                    kuah === opt.id
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
              Level Sambal Terasi
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '0' as const, label: 'Tanpa Sambal' },
                { id: '1' as const, label: 'Sedang' },
                { id: '2' as const, label: 'Mantap' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPedas(opt.id)}
                  className={`py-2.5 px-2 rounded-xl text-xs text-center border transition-all cursor-pointer ${
                    pedas === opt.id
                      ? 'border-neutral-900 bg-neutral-900 text-white font-bold'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700 font-medium'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ekstra Topping */}
        {extraOptions.length > 0 && (
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-2xs space-y-3">
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Tambah Lauk Pendamping
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {extraOptions.map((ext) => {
                const isChecked = selectedExtras.includes(ext.name);
                return (
                  <button
                    key={ext.id}
                    type="button"
                    onClick={() => toggleExtra(ext.name)}
                    className={`p-3 rounded-2xl text-left border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isChecked
                        ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-neutral-900">{ext.name}</div>
                      <div className="text-[11px] font-semibold text-neutral-500">
                        +{formatRupiah(ext.price)}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
                        isChecked ? 'bg-neutral-900 border-neutral-900 text-white' : 'border-neutral-300'
                      }`}
                    >
                      {isChecked && <span className="material-symbols-outlined text-[14px]">check</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Catatan Khusus */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-neutral-200/80 shadow-2xs">
          <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
            Catatan Dapur (Opsional)
          </label>
          <input
            type="text"
            value={kitchenNote}
            onChange={(e) => setKitchenNote(e.target.value)}
            placeholder="Contoh: Tanpa kecambah / kuah panas..."
            maxLength={80}
            className="w-full h-11 px-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white"
          />
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-200 p-4 pb-safe">
        <div className="w-full max-w-xl mx-auto flex items-center gap-3">
          <div className="flex items-center bg-neutral-100 rounded-2xl p-1 shrink-0 border border-neutral-200/80">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-700 hover:bg-white active:scale-95 disabled:opacity-30 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
            <span className="w-8 text-center text-xs font-bold text-neutral-900 tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-700 hover:bg-white active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 h-12 rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm flex items-center justify-between px-5 shadow-xs active:scale-98 cursor-pointer"
          >
            <span>{isEditing ? 'Perbarui Pesanan' : 'Tambah ke Pesanan'}</span>
            <span className="font-extrabold tabular-nums">{formatRupiah(totalCost)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
