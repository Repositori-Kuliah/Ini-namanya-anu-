import React from 'react';
import { useApp } from '../context/AppContext';
import { RESTAURANT_INFO } from '../data/menuData';

interface HeaderProps {
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onBack }) => {
  const { currentScreen, selectedTable, navigate, openTableModal } = useApp();

  if (currentScreen === 'welcome') {
    return null;
  }

  const screenSubtitleMap: Record<string, string> = {
    menu: 'Katalog Menu',
    cart: 'Keranjang',
    status: 'Status Pesanan',
    detail: `Meja ${selectedTable}`,
  };

  const subtitle = screenSubtitleMap[currentScreen] || 'Menu';

  return (
    <header className="fixed top-0 inset-x-0 z-50 pt-safe bg-[#fcf9f4]/95 backdrop-blur-md border-b border-[#ebe8e3]">
      <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl mx-auto h-16 px-4 md:px-6 flex items-center justify-between gap-2">
        {currentScreen === 'detail' ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              aria-label="Kembali ke katalog menu"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-[#f0ede9] text-[#3d1018] hover:bg-[#ebe8e3] flex items-center justify-center active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none shrink-0"
              onClick={onBack || (() => navigate('menu'))}
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span>
            </button>
            <div className="flex flex-col min-w-0">
              <h1 className="font-serif font-bold text-base sm:text-lg text-[#3d1018] leading-tight truncate">
                Detail Menu
              </h1>
              <span className="font-sans text-[11px] text-[#524344] truncate">
                Meja {selectedTable}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate('welcome')}
              aria-label="Kembali ke layar awal"
              className="w-10 h-10 rounded-xl bg-[#3d1018] p-1 flex items-center justify-center shadow-xs cursor-pointer hover:bg-[#58252c] focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none transition-colors shrink-0"
              title="Ke Layar Awal"
            >
              <img
                src={RESTAURANT_INFO.logoUrl}
                alt="Logo Rawon Gusti"
                className="w-full h-full object-contain"
              />
            </button>
            <div className="min-w-0">
              <h1 className="font-serif text-base sm:text-[17px] font-bold text-[#3d1018] leading-tight tracking-tight truncate">
                {RESTAURANT_INFO.name}
              </h1>
              <span className="text-[11px] font-sans text-[#524344] block truncate">
                {subtitle}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
