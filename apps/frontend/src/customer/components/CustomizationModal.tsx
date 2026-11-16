import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem } from '../types';
import { placeholderImage } from '../../lib/placeholder';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({ isOpen, onClose, item }) => {
  const { addToCart, extraOptions, formatRupiah, menuItems } = useApp();

  const [quantity, setQuantity] = useState<number>(1);
  const [kuah, setKuah] = useState<'campur' | 'pisah'>('campur');
  const [pedas, setPedas] = useState<'0' | '1' | '2'>('1');
  const [sayur, setSayur] = useState<'lengkap' | 'pisah'>('lengkap');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [kitchenNote, setKitchenNote] = useState<string>('');

  // Cari minuman rekomendasi untuk upselling ala BK
  const upsellDrink = useMemo(() => {
    return (
      menuItems.find((m) => m.category?.toLowerCase().includes('minuman') && m.id !== item.id) ||
      null
    );
  }, [menuItems, item.id]);
  const [addUpsellDrink, setAddUpsellDrink] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setQuantity(1);
    setKuah('campur');
    setPedas('1');
    setSayur('lengkap');
    setSelectedExtras([]);
    setKitchenNote('');
    setAddUpsellDrink(false);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, item.id, onClose]);

  if (!isOpen) return null;

  const toggleExtra = (extraName: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extraName) ? prev.filter((e) => e !== extraName) : [...prev, extraName]
    );
  };

  // Hitung total harga
  const extrasCost = selectedExtras.reduce((sum, extraName) => {
    const match = extraOptions.find((opt) => opt.name === extraName);
    return sum + (match ? match.price : 0);
  }, 0);

  const baseTotal = (item.price + extrasCost) * quantity;
  const grandTotal = baseTotal + (addUpsellDrink && upsellDrink ? upsellDrink.price : 0);

  const handleAddToCart = () => {
    addToCart(
      item,
      {
        kuah,
        pedas,
        sayur,
        extras: selectedExtras,
        kitchenNotes: kitchenNote.trim() || undefined,
      },
      quantity
    );

    // Upsell minuman
    if (addUpsellDrink && upsellDrink) {
      addToCart(
        upsellDrink,
        {
          kuah: 'campur',
          pedas: '0',
          sayur: 'lengkap',
          extras: [],
          kitchenNotes: 'Paket dari ' + item.name,
        },
        1
      );
    }

    onClose();
  };

  const isRawonOrFood =
    item.category?.toLowerCase().includes('rawon') ||
    item.category?.toLowerCase().includes('makanan') ||
    item.category?.toLowerCase().includes('utama');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kiosk-item-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] bg-[#fcf9f4] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#ebe8e3]">
        {/* Header Modal: Foto & Detail Menu */}
        <div className="relative p-5 pb-4 bg-white border-b border-[#ebe8e3] flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-[#f6f3ee] overflow-hidden shrink-0 border border-[#ebe8e3]">
            <img
              src={item.image || placeholderImage(item.name)}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = placeholderImage(item.name);
              }}
            />
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <span className="text-[10px] font-bold text-[#994703] uppercase tracking-wider font-sans">
              {item.category || 'Menu Spesial'}
            </span>
            <h2 id="kiosk-item-title" className="font-serif text-lg font-bold text-[#3d1018] leading-snug">
              {item.name}
            </h2>
            <p className="font-sans text-xs text-[#6b5a5b] line-clamp-2 mt-0.5">
              {item.description}
            </p>
            <div className="mt-1 font-serif text-sm font-extrabold text-[#3d1018]">
              {formatRupiah(item.price)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kustomisasi"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#f0ede9] hover:bg-[#ebe8e3] text-[#3d1018] flex items-center justify-center cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Body: Pilihan Kustomisasi ala BK Kiosk */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Racikan Kuah & Pedas (Jika Makanan Berkuah / Rawon) */}
          {isRawonOrFood && (
            <div className="space-y-4">
              {/* Opsi Kuah */}
              <div>
                <label className="block text-xs font-bold text-[#1c1c19] uppercase tracking-wider mb-2 font-sans">
                  Penyajian Kuah
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'campur' as const, label: 'Kuah Dicampur', desc: 'Sajian tradisional hangat' },
                    { id: 'pisah' as const, label: 'Kuah Dipisah', desc: 'Disajikan mangkok terpisah' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setKuah(opt.id)}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                        kuah === opt.id
                          ? 'border-[#3d1018] bg-[#3d1018] text-white shadow-xs'
                          : 'border-[#ebe8e3] bg-white hover:bg-[#f6f3ee] text-[#1c1c19]'
                      }`}
                    >
                      <div className="text-xs font-bold font-sans">{opt.label}</div>
                      <div className={`text-[11px] mt-0.5 ${kuah === opt.id ? 'text-[#ffdbc9]' : 'text-[#6b5a5b]'}`}>
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opsi Tingkat Pedas */}
              <div>
                <label className="block text-xs font-bold text-[#1c1c19] uppercase tracking-wider mb-2 font-sans">
                  Level Sambal Terasi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '0' as const, label: 'Tanpa Sambal' },
                    { id: '1' as const, label: 'Sedang' },
                    { id: '2' as const, label: 'Pedas Mantap' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPedas(opt.id)}
                      className={`py-2.5 px-2 rounded-xl text-center border transition-all cursor-pointer ${
                        pedas === opt.id
                          ? 'border-[#3d1018] bg-[#3d1018] text-white font-bold shadow-xs'
                          : 'border-[#ebe8e3] bg-white hover:bg-[#f6f3ee] text-[#1c1c19] font-medium'
                      }`}
                    >
                      <span className="text-xs block font-sans">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Add-ons / Ekstra Topping ala BK */}
          {extraOptions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#1c1c19] uppercase tracking-wider font-sans">
                  Tambah Lauk Pendamping
                </label>
                <span className="text-[11px] text-[#847374] font-sans">Opsional</span>
              </div>
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
                          ? 'border-[#3d1018] bg-[#f0ede9] ring-1 ring-[#3d1018]'
                          : 'border-[#ebe8e3] bg-white hover:bg-[#f6f3ee]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#1c1c19] truncate font-sans">
                          {ext.name}
                        </div>
                        <div className="text-[11px] font-bold text-[#994703] mt-0.5">
                          +{formatRupiah(ext.price)}
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                          isChecked
                            ? 'bg-[#3d1018] border-[#3d1018] text-white'
                            : 'border-[#d7c2c2] bg-white'
                        }`}
                      >
                        {isChecked && (
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upselling Minuman Hemat ala BK */}
          {upsellDrink && (
            <div className="p-3.5 rounded-2xl bg-[#ffdbc9]/40 border border-[#fc934f]/50">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#ffdbc9] flex items-center justify-center text-[#753400] shrink-0">
                    <span className="material-symbols-outlined text-[20px]">local_cafe</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#753400] uppercase tracking-wider block font-sans">
                      Paket Hemat Minuman
                    </span>
                    <span className="text-xs font-bold text-[#1c1c19] block truncate font-sans">
                      {upsellDrink.name} (+{formatRupiah(upsellDrink.price)})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAddUpsellDrink(!addUpsellDrink)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    addUpsellDrink
                      ? 'bg-[#3d1018] text-white'
                      : 'bg-white text-[#3d1018] border border-[#ebe8e3] hover:bg-[#f0ede9]'
                  }`}
                >
                  {addUpsellDrink ? '✓ Ditambahkan' : '+ Tambah'}
                </button>
              </div>
            </div>
          )}

          {/* Catatan Khusus untuk Dapur */}
          <div>
            <label className="block text-xs font-bold text-[#1c1c19] uppercase tracking-wider mb-1.5 font-sans">
              Catatan Dapur (Opsional)
            </label>
            <input
              type="text"
              value={kitchenNote}
              onChange={(e) => setKitchenNote(e.target.value)}
              placeholder="Contoh: Tanpa tauge, kuah agak panas..."
              maxLength={80}
              className="w-full h-11 px-3.5 rounded-xl bg-white border border-[#ebe8e3] text-xs text-[#1c1c19] placeholder-[#847374] focus:outline-none focus:ring-2 focus:ring-[#3d1018] transition-all"
            />
          </div>
        </div>

        {/* Footer Modal: Kuantitas & CTA Tambah ke Keranjang */}
        <div className="p-4 bg-white border-t border-[#ebe8e3] flex items-center gap-3">
          {/* Stepper Jumlah Porsi */}
          <div className="flex items-center bg-[#f0ede9] rounded-2xl p-1 shrink-0 border border-[#ebe8e3]">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#3d1018] hover:bg-white active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all"
              aria-label="Kurangi jumlah"
            >
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
            <span className="w-8 text-center text-xs font-bold text-[#1c1c19] tabular-nums font-sans">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#3d1018] hover:bg-white active:scale-95 cursor-pointer transition-all"
              aria-label="Tambah jumlah"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>

          {/* Tombol CTA Pesan */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 h-12 rounded-2xl bg-[#3d1018] hover:bg-[#58252c] text-white font-bold text-xs sm:text-sm flex items-center justify-between px-5 shadow-xs active:scale-98 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
          >
            <span className="font-sans">Tambah ke Pesanan</span>
            <span className="font-serif font-extrabold tabular-nums tracking-wide">
              {formatRupiah(grandTotal)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
