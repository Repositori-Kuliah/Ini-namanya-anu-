import React from 'react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { currentScreen, navigate, activeOrder } = useApp();

  if (currentScreen === 'welcome' || currentScreen === 'detail') {
    return null;
  }

  const hasOngoingOrder = Boolean(activeOrder && activeOrder.statusStage < 4);

  const tabs = [
    {
      id: 'menu' as const,
      label: 'Katalog',
      icon: 'restaurant_menu',
    },
    {
      id: 'status' as const,
      label: 'Pesanan',
      icon: 'receipt_long',
      hasDot: hasOngoingOrder,
    },
  ];

  return (
    <nav
      aria-label="Navigasi Utama"
      className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-[#fcf9f4]/95 backdrop-blur-md border-t border-[#ebe8e3] shadow-xs"
    >
      <div className="w-full max-w-md md:max-w-4xl lg:max-w-[1600px] mx-auto flex justify-around items-center h-14 px-4">
        {tabs.map((tab) => {
          const isActive = currentScreen === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.id)}
              className={`relative flex items-center justify-center gap-1.5 px-6 py-1.5 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-[#3d1018] bg-[#f0ede9] font-bold'
                  : 'text-[#6b5a5b] hover:text-[#3d1018] font-medium'
              }`}
            >
              <span className="relative flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {tab.icon}
                </span>
                {tab.hasDot && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#994703] ring-2 ring-white" />
                )}
              </span>
              <span className="text-xs font-sans">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
