import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem } from '../types';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({ isOpen, onClose, item }) => {
  const { addToCart } = useApp();
  const [sambalLevel, setSambalLevel] = useState<'0' | '1' | '2'>('1');
  const [sayurOption, setSayurOption] = useState<'lengkap' | 'pisah'>('lengkap');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = () => {
    addToCart(
      item,
      {
        kuah: 'campur',
        pedas: sambalLevel,
        sayur: sayurOption,
        extras: [],
      },
      1
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customization-modal-title"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl border border-[#ebe8e3] flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#f0ede9]">
          <div className="min-w-0 pr-2">
            <h3 id="customization-modal-title" className="font-serif font-bold text-lg text-[#1c1c19] truncate">
              Kustomisasi {item.name}
            </h3>
            <p className="font-sans text-xs text-[#524344]">
              Sesuaikan tingkat pedas dan racikan pelengkap
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup kustomisasi"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#f0ede9] text-[#524344] flex items-center justify-center hover:bg-[#ebe8e3] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Option 1: Level Pedas */}
        <div className="flex flex-col gap-2">
          <span className="font-sans font-bold text-xs text-[#1c1c19]">
            Level Sambal Terasi Terpisah
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: '1' as const, label: 'Sedang' },
              { id: '2' as const, label: 'Pedas Mantap' },
              { id: '0' as const, label: 'Tanpa Sambal' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={sambalLevel === opt.id}
                onClick={() => setSambalLevel(opt.id)}
                className={`min-h-[44px] px-2.5 py-2 rounded-xl font-sans text-xs text-center font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none ${
                  sambalLevel === opt.id
                    ? 'bg-[#3d1018] text-white shadow-xs'
                    : 'bg-[#f6f3ee] text-[#1c1c19] hover:bg-[#ebe8e3] border border-[#ebe8e3]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Option 2: Tauge & Daun Bawang */}
        <div className="flex flex-col gap-2">
          <span className="font-sans font-bold text-xs text-[#1c1c19]">
            Penyajian Sayur Pelengkap
          </span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'lengkap' as const, label: 'Tauge & Bawang Lengkap' },
              { id: 'pisah' as const, label: 'Pisah Sayur' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={sayurOption === opt.id}
                onClick={() => setSayurOption(opt.id)}
                className={`min-h-[44px] px-3 py-2 rounded-xl font-sans text-xs text-center font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none ${
                  sayurOption === opt.id
                    ? 'bg-[#3d1018] text-white shadow-xs'
                    : 'bg-[#f6f3ee] text-[#1c1c19] hover:bg-[#ebe8e3] border border-[#ebe8e3]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleApply}
          className="w-full h-12 bg-[#3d1018] hover:bg-[#58252c] text-white rounded-xl font-sans font-bold text-sm mt-1 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
        >
          <span>Terapkan &amp; Tambah ke Pesanan</span>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">check</span>
        </button>
      </div>
    </div>
  );
};
