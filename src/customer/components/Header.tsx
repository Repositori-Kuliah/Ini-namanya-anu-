import React from 'react';
import { useApp } from '../context/AppContext';
import { RESTAURANT_INFO } from '../data/menuData';

interface HeaderProps {
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onBack }) => {
  const { currentScreen, navigate, selectedTable } = useApp();

  const isDetail = currentScreen === 'detail';

  return (
    <header className="fixed top-0 inset-x-0 z-50 pt-safe bg-[#fcf9f4]/95 backdrop-blur-md border-b border-[#ebe8e3] transition-all">
      <div className="w-full max-w-md md:max-w-4xl lg:max-w-[1600px] mx-auto h-14 px-4 md:px-6 flex items-center justify-between gap-3">
        {isDetail ? (
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack || (() => navigate('menu'))}
              aria-label="Kembali ke menu"
              className="w-9 h-9 rounded-xl bg-[#f0ede9] text-[#3d1018] hover:bg-[#ebe8e3] active:scale-95 flex items-center justify-center transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                arrow_back
              </span>
            </button>
            <h1 className="font-serif text-base font-bold text-[#3d1018] truncate">
              Kustomisasi Menu
            </h1>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-serif text-base sm:text-lg font-bold text-[#3d1018] tracking-tight leading-none">
              {RESTAURANT_INFO.name}
            </h1>
          </div>
        )}
      </div>
    </header>
  );
};
