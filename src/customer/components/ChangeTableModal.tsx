import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

// Meja dikenali dari QR yang dipindai (bukan dipilih manual) agar pesanan tidak salah meja.
export const ChangeTableModal: React.FC = () => {
  const { isTableModalOpen, closeTableModal, selectedTable, tableArea } = useApp();

  useEffect(() => {
    if (!isTableModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTableModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isTableModalOpen, closeTableModal]);

  if (!isTableModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-table-modal-title"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeTableModal();
      }}
    >
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-4 shadow-2xl border border-[#ebe8e3]">
        <div className="flex items-center justify-between pb-3 border-b border-[#f0ede9]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#f0ede9] text-[#3d1018] flex items-center justify-center border border-[#ebe8e3]">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">table_restaurant</span>
            </div>
            <div>
              <h3 id="change-table-modal-title" className="font-serif font-bold text-base text-[#1c1c19]">
                Informasi &amp; Pindah Meja
              </h3>
              <p className="text-[11px] text-[#524344]">
                Meja {selectedTable} · {tableArea}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeTableModal}
            aria-label="Tutup dialog informasi meja"
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#f0ede9] hover:bg-[#ebe8e3] flex items-center justify-center text-[#524344] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
          </button>
        </div>

        <p className="font-sans text-xs text-[#524344] leading-relaxed">
          Anda sedang memesan untuk <strong className="text-[#1c1c19]">Meja {selectedTable}</strong> ({tableArea}).
          Untuk berpindah meja, silakan pindai ulang kode QR yang terpasang pada meja tujuan menggunakan kamera ponsel,
          atau minta bantuan pelayan kami.
        </p>

        <button
          type="button"
          onClick={closeTableModal}
          className="w-full h-12 bg-[#3d1018] hover:bg-[#58252c] text-white rounded-xl font-sans font-bold text-sm shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none transition-colors"
        >
          Mengerti
        </button>
      </div>
    </div>
  );
};
