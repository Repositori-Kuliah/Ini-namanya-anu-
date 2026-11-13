import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RESTAURANT_INFO } from '../data/menuData';
import heroRawonImg from '../../assets/images/hero_rawon_daging_1794405798124.jpg';

export const WelcomeScreen: React.FC = () => {
  const {
    selectedTable,
    tableArea,
    guestsCount,
    setGuests,
    navigate,
  } = useApp();

  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  const handleStartOrder = () => {
    setIsLoadingMenu(true);
    setTimeout(() => {
      setIsLoadingMenu(false);
      navigate('menu');
    }, 200);
  };

  return (
    <article className="flex flex-col w-full pb-10 min-h-screen bg-[#fcf9f4]">
      {/* Editorial Food Hero Section */}
      <header className="relative w-full overflow-hidden bg-[#3d1018] text-white">
        <div className="relative h-56 sm:h-64 md:h-72 w-full overflow-hidden">
          <img
            src={heroRawonImg}
            alt="Sajian Rawon Daging khas Rawon Gusti Surabaya"
            className="w-full h-full object-cover object-center"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3d1018] via-[#3d1018]/65 to-black/25" />
        </div>

        {/* Brand & Editorial Title Lockup */}
        <div className="relative px-5 md:px-8 pt-2 pb-9 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-white p-1 border border-white/25 shrink-0 shadow-xs flex items-center justify-center">
              <img
                alt="Logo Rawon Gusti Surabaya"
                className="w-full h-full object-contain"
                src={RESTAURANT_INFO.logoUrl}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight leading-none">
                {RESTAURANT_INFO.name}
              </span>
              <span className="text-[11px] text-[#ffdbc9] font-sans font-medium tracking-wide mt-1">
                {RESTAURANT_INFO.branch} · Sejak 1982
              </span>
            </div>
          </div>

          <div className="pt-1 space-y-1.5 max-w-xl">
            <p className="text-[11px] text-[#ffdbc9] font-semibold tracking-wider uppercase font-sans">
              Sugeng Rawuh · Kuliner Otentik Surabaya
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
              Kehangatan Rawon Kluwek Asli
            </h1>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-sans">
              Racikan rempah kluwek tradisional berpadu daging sapi empuk, tauge segar, dan telur asin masir.
            </p>
          </div>
        </div>
      </header>

      {/* Main Card Container */}
      <div className="relative z-10 px-4 md:px-8 -mt-5 space-y-4 max-w-xl mx-auto w-full">
        <section
          className="bg-white rounded-2xl p-5 shadow-sm border border-[#ebe8e3] space-y-4"
          aria-label="Informasi Tempat Duduk"
        >
          <div className="flex items-center justify-between border-b border-[#f0ede9] pb-3.5 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#f0ede9] text-[#3d1018] flex items-center justify-center shrink-0 border border-[#ebe8e3]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">table_restaurant</span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-[#847374] uppercase tracking-wider block font-sans">
                  Lokasi Meja
                </span>
                <h2 className="font-serif text-lg font-bold text-[#1c1c19] truncate">
                  Meja {selectedTable}
                </h2>
              </div>
            </div>
          </div>

          {/* Stepper Jumlah Tamu */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1c1c19] font-sans" id="guest-stepper-label">
                Jumlah Pelanggan
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 bg-[#fcf9f4] p-3 rounded-xl border border-[#ebe8e3]">
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-[#ebe8e3] shadow-xs">
                <button
                  type="button"
                  onClick={() => setGuests(guestsCount - 1)}
                  disabled={guestsCount <= 1}
                  aria-label="Kurangi jumlah orang"
                  className="w-10 h-10 rounded-lg bg-[#f0ede9] text-[#1c1c19] flex items-center justify-center hover:bg-[#ebe8e3] active:scale-95 disabled:opacity-35 transition-colors focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">remove</span>
                </button>
                <span
                  id="guest-count-stepper"
                  aria-labelledby="guest-stepper-label"
                  aria-live="polite"
                  className="font-sans text-lg font-bold text-[#3d1018] min-w-[36px] text-center tabular-nums"
                >
                  {guestsCount}
                </span>
                <button
                  type="button"
                  onClick={() => setGuests(guestsCount + 1)}
                  disabled={guestsCount >= 12}
                  aria-label="Tambah jumlah orang"
                  className="w-10 h-10 rounded-lg bg-[#3d1018] text-white flex items-center justify-center hover:bg-[#58252c] active:scale-95 disabled:opacity-35 transition-colors focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Primary Action */}
          <button
            type="button"
            onClick={handleStartOrder}
            disabled={isLoadingMenu}
            aria-label="Mulai Pilih Menu"
            className="w-full h-12 bg-[#3d1018] hover:bg-[#58252c] text-white font-sans font-bold text-sm rounded-xl shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80 focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none"
          >
            {isLoadingMenu ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">
                  progress_activity
                </span>
                <span>Memuat Menu...</span>
              </>
            ) : (
              <>
                <span>Mulai Pilih Menu</span>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </section>
      </div>
    </article>
  );
};
