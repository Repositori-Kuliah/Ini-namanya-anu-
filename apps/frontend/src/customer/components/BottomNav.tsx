import React from 'react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { currentScreen, navigate, cartCount, activeOrder } = useApp();

  // Sembunyikan bottom nav pada layar sambutan atau detail menu (yang punya sticky CTA sendiri)
  if (currentScreen === 'welcome' || currentScreen === 'detail') {
    return null;
  }

  const hasOngoingOrder = Boolean(activeOrder && activeOrder.statusStage < 4);

  const tabs = [
    {
      id: 'menu' as const,
      label: 'Menu',
      icon: 'restaurant_menu',
      ariaLabel: 'Katalog Menu',
    },
    {
      id: 'cart' as const,
      label: 'Keranjang',
      icon: 'shopping_bag',
      ariaLabel: `Keranjang Pesanan, ${cartCount} item`,
      badge: cartCount,
    },
    {
      id: 'status' as const,
      label: 'Status',
      icon: 'receipt_long',
      ariaLabel: 'Status Pesanan Meja',
      hasDot: hasOngoingOrder,
    },
  ];

  return (
    <nav
      aria-label="Navigasi Utama Pelanggan"
      className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-[#fcf9f4]/95 backdrop-blur-md border-t border-[#ebe8e3] shadow-[0_-4px_16px_rgba(61,16,24,0.06)]"
    >
      <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl mx-auto flex justify-around items-center h-16 px-3">
        {tabs.map((tab) => {
          const isActive = currentScreen === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.id)}
              aria-label={tab.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-w-[80px] min-h-[44px] px-3 py-1 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#3d1018] focus-visible:outline-none ${
                isActive
                  ? 'text-[#3d1018] bg-[#f0ede9]/80 font-bold'
                  : 'text-[#524344] hover:text-[#3d1018] font-medium'
              }`}
            >
              <span className="relative inline-flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[21px]"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  aria-hidden="true"
                >
                  {tab.icon}
                </span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-[#994703] text-white rounded-full text-[10px] leading-none font-bold flex items-center justify-center tabular-nums shadow-xs">
                    {tab.badge}
                  </span>
                )}
                {tab.hasDot && (
                  <span
                    className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-[#994703] ring-2 ring-[#fcf9f4]"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span className="text-[11px] font-sans mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
