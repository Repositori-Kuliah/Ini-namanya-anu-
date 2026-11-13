import React, { useState } from 'react';
import { useApp, AppView } from '../context/AppContext';
import { UserRole } from '../types';

export const HelpModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl z-50 border border-[#ebe8e3] max-h-[85vh] overflow-y-auto space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#ebe8e3]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#3d1018] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">help</span>
            </div>
            <div>
              <h3 id="help-title" className="font-bold text-base text-[#1c1c19]">
                Bantuan &amp; Panduan Operasional
              </h3>
              <p className="text-xs text-[#524344]">Sistem POS Rawon Gusti Surabaya</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#524344] hover:text-[#1c1c19] hover:bg-[#f0ede9] transition-colors cursor-pointer"
            aria-label="Tutup panduan"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-3 text-xs text-[#524344] leading-relaxed">
          <div className="p-3.5 bg-[#fcf9f4] rounded-xl border border-[#ebe8e3]">
            <h4 className="font-bold text-[#3d1018] flex items-center gap-1.5 mb-1.5 text-xs">
              <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
              <span>1. Peran Kasir POS</span>
            </h4>
            <p>
              Kasir mengelola layanan santap di tempat pada <strong>Meja &amp; Pelanggan</strong>, pembuatan <strong>Pesanan Baru</strong>, pencatatan pembayaran (Tunai, QRIS, Kartu Debit), cetak struk termal, serta rekonsiliasi kas pada <strong>Tutup Kasir</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-[#fcf9f4] rounded-xl border border-[#ebe8e3]">
            <h4 className="font-bold text-[#3d1018] flex items-center gap-1.5 mb-1.5 text-xs">
              <span className="material-symbols-outlined text-[16px]">skillet</span>
              <span>2. Peran Dapur &amp; Bar</span>
            </h4>
            <p>
              Dapur dan bar memantau tiket pesanan pelanggan pada stasiun <strong>Dapur Utama (Makanan)</strong> dan <strong>Bar Minuman</strong> melalui alur penyajian <strong>Baru ➔ Dimasak ➔ Siap Diantar</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-[#fcf9f4] rounded-xl border border-[#ebe8e3]">
            <h4 className="font-bold text-[#3d1018] flex items-center gap-1.5 mb-1.5 text-xs">
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span>3. Peran Admin Outlet</span>
            </h4>
            <p>
              Admin memiliki otorisasi penuh: grafik analisis <strong>Dashboard Penjualan</strong>, manajemen <strong>Kelola Menu &amp; Stok Bahan Baku</strong>, pendaftaran <strong>Kelola Meja &amp; Kode QR</strong>, pengoperasian <strong>Akun Staf</strong>, serta audit <strong>Laporan Transaksi &amp; Rekap Kasir</strong>.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#3d1018] text-white text-xs font-bold hover:bg-[#58252c] transition-all cursor-pointer"
          >
            Mengerti &amp; Tutup
          </button>
        </div>
      </div>
    </>
  );
};

export const MobileHeader: React.FC = () => {
  const { activeView, logout } = useApp();

  const getPageTitleBadge = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Dashboard';
      case 'meja-dan-pelanggan':
        return 'Meja & Pelanggan';
      case 'pesanan-baru':
        return 'Pesanan Baru';
      case 'checkout':
      case 'pembayaran':
        return 'Checkout & Bayar';
      case 'pantau-pesanan':
        return 'Pantau Pesanan';
      case 'kelola-menu':
        return 'Kelola Menu';
      case 'kelola-meja':
        return 'Kelola Meja';
      case 'akun-staf-dan-role':
        return 'Akun Staf & Role';
      case 'laporan':
        return 'Laporan Transaksi';
      default:
        return 'Operasional';
    }
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 bg-[#fcf9f4]/95 backdrop-blur-md pt-safe border-b border-[#ebe8e3]">
        <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-[1720px] mx-auto">
          {/* Brand Left */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#3d1018] flex items-center justify-center p-0.5 shrink-0">
              <img
                alt="Logo Rawon Gusti"
                className="w-full h-full object-contain"
                src="/logo-rawon.png"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-[#3d1018] truncate">
                  Rawon Gusti
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#ebe8e3] text-[#524344] text-[10px] font-semibold truncate hidden xs:inline">
                  {getPageTitleBadge()}
                </span>
              </div>
              <span className="text-[11px] text-[#524344] truncate">Surabaya • Dine-in</span>
            </div>
          </div>

          {/* Action Right */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={logout}
              className="w-8 h-8 rounded-lg bg-[#f0ede9] text-[#3d1018] hover:bg-[#ffdadc] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              aria-label="Keluar shift"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export const MobileBottomNav: React.FC = () => {
  const { activeView, setActiveView, currentRole } = useApp();
  const [mobileAdminOpen, setMobileAdminOpen] = useState(false);

  // Role-based mobile navigation tabs
  const getNavItems = (): { label: string; icon: string; view: AppView | 'admin-drawer' }[] => {
    if (currentRole === 'kitchen') {
      return [{ label: 'Pantau Pesanan', icon: 'skillet', view: 'pantau-pesanan' }];
    }
    if (currentRole === 'kasir') {
      return [
        { label: 'Meja', icon: 'table_restaurant', view: 'meja-dan-pelanggan' },
        { label: 'Pesanan', icon: 'add_shopping_cart', view: 'pesanan-baru' },
        { label: 'Checkout', icon: 'point_of_sale', view: 'checkout' },
      ];
    }
    // Admin
    return [
      { label: 'Meja', icon: 'table_restaurant', view: 'meja-dan-pelanggan' },
      { label: 'Pesanan', icon: 'add_shopping_cart', view: 'pesanan-baru' },
      { label: 'Checkout', icon: 'point_of_sale', view: 'checkout' },
      { label: 'Pantau', icon: 'skillet', view: 'pantau-pesanan' },
      { label: 'Manajemen', icon: 'apps', view: 'admin-drawer' },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      <nav
        aria-label="Navigasi Bawah Ponsel"
        className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-[#fcf9f4]/95 backdrop-blur-md border-t border-[#ebe8e3]"
      >
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-1">
          {navItems.map((item) => {
            const isDrawer = item.view === 'admin-drawer';
            const isActive =
              !isDrawer &&
              (activeView === item.view ||
                (item.view === 'checkout' && activeView === 'pembayaran'));

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (isDrawer) {
                    setMobileAdminOpen(true);
                  } else {
                    setActiveView(item.view as AppView);
                  }
                }}
                className={`flex flex-col items-center justify-center gap-0.5 w-16 h-14 transition-colors cursor-pointer ${
                  isActive ? 'text-[#3d1018] font-bold' : 'text-[#524344] hover:text-[#3d1018]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span
                  className={`material-symbols-outlined text-[20px] transition-transform ${
                    isActive ? 'scale-110 text-[#3d1018]' : ''
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-[10px] leading-tight text-center">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Admin Mobile Quick Menu Sheet */}
      {mobileAdminOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
            onClick={() => setMobileAdminOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bottom-sheet-title"
            className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl p-5 shadow-2xl border-t border-[#ebe8e3] space-y-3 max-h-[85vh] overflow-y-auto"
          >
            <div className="w-10 h-1 bg-[#d7c2c2] rounded-full mx-auto mb-1"></div>
            <div className="flex items-center justify-between pb-2 border-b border-[#ebe8e3]">
              <h3 id="bottom-sheet-title" className="font-bold text-sm text-[#1c1c19]">
                Menu Manajemen Outlet
              </h3>
              <button
                type="button"
                onClick={() => setMobileAdminOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#524344] hover:bg-[#f0ede9] cursor-pointer"
                aria-label="Tutup menu"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Dashboard', icon: 'grid_view', view: 'dashboard' as AppView },
                { label: 'Kelola Menu', icon: 'restaurant_menu', view: 'kelola-menu' as AppView },
                { label: 'Kelola Meja', icon: 'deck', view: 'kelola-meja' as AppView },
                { label: 'Akun Staf & Role', icon: 'badge', view: 'akun-staf-dan-role' as AppView },
                { label: 'Laporan Transaksi', icon: 'query_stats', view: 'laporan' as AppView },
              ].map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => {
                    setActiveView(m.view);
                    setMobileAdminOpen(false);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeView === m.view
                      ? 'bg-[#3d1018] text-white border-[#3d1018]'
                      : 'bg-[#fcf9f4] hover:bg-[#f0ede9] text-[#1c1c19] border-[#ebe8e3]'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      activeView === m.view ? 'text-[#ffdadc]' : 'text-[#994703]'
                    }`}
                  >
                    {m.icon}
                  </span>
                  <span className="font-bold text-xs">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export const DesktopSidebar: React.FC = () => {
  const { activeView, setActiveView, logout, currentUser, currentRole, desktopSidebarOpen } = useApp();

  // Kelompok A: Navigasi Operasional
  const getOperationalNav = () => {
    if (currentRole === 'kitchen') {
      return [{ label: 'Pantau Pesanan (KDS)', icon: 'skillet', view: 'pantau-pesanan' as AppView }];
    }
    if (currentRole === 'kasir') {
      return [
        { label: 'Meja & Pelanggan', icon: 'table_restaurant', view: 'meja-dan-pelanggan' as AppView },
        { label: 'Pesanan Baru', icon: 'add_shopping_cart', view: 'pesanan-baru' as AppView },
        { label: 'Checkout & Bayar', icon: 'point_of_sale', view: 'checkout' as AppView },
      ];
    }
    // Admin
    return [
      { label: 'Dashboard', icon: 'grid_view', view: 'dashboard' as AppView },
      { label: 'Meja & Pelanggan', icon: 'table_restaurant', view: 'meja-dan-pelanggan' as AppView },
      { label: 'Pesanan Baru', icon: 'add_shopping_cart', view: 'pesanan-baru' as AppView },
      { label: 'Checkout & Bayar', icon: 'point_of_sale', view: 'checkout' as AppView },
      { label: 'Pantau Pesanan', icon: 'skillet', view: 'pantau-pesanan' as AppView },
    ];
  };

  // Kelompok B: Navigasi Manajemen & Laporan (Khusus Admin)
  const managementNav = [
    { label: 'Kelola Menu', icon: 'restaurant_menu', view: 'kelola-menu' as AppView },
    { label: 'Kelola Meja', icon: 'deck', view: 'kelola-meja' as AppView },
    { label: 'Akun Staf & Role', icon: 'badge', view: 'akun-staf-dan-role' as AppView },
    { label: 'Laporan', icon: 'query_stats', view: 'laporan' as AppView },
  ];

  const operationalNav = getOperationalNav();

  return (
    <aside
      aria-label="Navigasi Utama Desktop"
      className={`fixed left-0 top-0 h-screen w-64 bg-[#3d1018] text-white z-40 flex flex-col justify-between shadow-md transition-transform duration-300 ease-in-out ${
        desktopSidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
      }`}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div className="p-4 flex items-center gap-3 bg-[#3d1018]/80 border-b border-white/10 shrink-0">
          <img
            alt="Logo Rawon Gusti"
            className="w-9 h-9 rounded-lg object-contain bg-white/10 p-1"
            src="/logo-rawon.png"
            width={36}
            height={36}
          />
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-sm text-[#ffdadc] leading-tight tracking-wide truncate">
              Rawon Gusti
            </span>
            <span className="text-[11px] text-[#ffdadc]/70 truncate">Surabaya • Dine-in</span>
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <nav className="p-3 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Kelompok A: OPERASIONAL */}
          <div>
            <span className="text-[10px] font-bold text-[#ffdadc]/70 uppercase tracking-wider block px-2 mb-1.5">
              Operasional
            </span>
            <div className="space-y-0.5">
              {operationalNav.map((item) => {
                const isActive =
                  activeView === item.view ||
                  (item.view === 'checkout' && activeView === 'pembayaran');
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setActiveView(item.view)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#58252c] text-white shadow-xs'
                        : 'text-white/80 hover:bg-[#58252c]/50 hover:text-white'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="material-symbols-outlined text-[18px] shrink-0">
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pemisah Visual Sederhana & Kelompok B: MANAJEMEN & LAPORAN */}
          {currentRole === 'admin' && (
            <div className="pt-2 border-t border-white/10">
              <span className="text-[10px] font-bold text-[#ffdadc]/70 uppercase tracking-wider block px-2 mb-1.5">
                Manajemen &amp; Laporan
              </span>
              <div className="space-y-0.5">
                {managementNav.map((item) => {
                  const isActive = activeView === item.view;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setActiveView(item.view)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-[#58252c] text-white shadow-xs'
                          : 'text-white/80 hover:bg-[#58252c]/50 hover:text-white'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className="material-symbols-outlined text-[18px] shrink-0">
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Sidebar Footer: Info Akun Staf & Tombol Logout */}
      <div className="p-3.5 bg-[#58252c]/50 border-t border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#58252c] flex items-center justify-center text-xs font-bold text-[#ffdadc] ring-1 ring-white/20 shrink-0 uppercase">
            {currentUser.name ? currentUser.name.slice(0, 2) : 'RG'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate leading-tight">
              {currentUser.name || 'Staf Operasional'}
            </span>
            <span className="text-[10px] text-[#ffdadc]/70 truncate capitalize">
              {currentRole} Outlet
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Keluar shift"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
        </button>
      </div>
    </aside>
  );
};

export const DesktopHeader: React.FC = () => {
  const { activeView, desktopSidebarOpen, toggleDesktopSidebar } = useApp();
  const [helpOpen, setHelpOpen] = useState(false);

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Dashboard Operasional';
      case 'meja-dan-pelanggan':
        return 'Meja & Pelanggan';
      case 'pesanan-baru':
        return 'Pesanan Baru';
      case 'checkout':
      case 'pembayaran':
        return 'Checkout & Pembayaran';
      case 'pantau-pesanan':
        return 'Pantau Pesanan (KDS)';
      case 'kelola-menu':
        return 'Kelola Menu';
      case 'kelola-meja':
        return 'Kelola Meja';
      case 'akun-staf-dan-role':
        return 'Akun Staf & Role';
      case 'laporan':
        return 'Laporan Transaksi';
      default:
        return 'Operasional';
    }
  };

  return (
    <>
      <header className={`fixed top-0 ${desktopSidebarOpen ? 'left-64' : 'left-0'} right-0 z-30 bg-[#fcf9f4]/90 backdrop-blur-md border-b border-[#ebe8e3] transition-all duration-300`}>
        <div className="h-16 px-6 flex items-center justify-between">
          {/* Breadcrumb & Toggle Sidebar */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleDesktopSidebar}
              className="p-1.5 rounded-lg text-[#3d1018] bg-white border border-[#ebe8e3] hover:bg-[#ebe8e3] hover:text-[#1c1c19] transition-colors cursor-pointer flex items-center justify-center shadow-2xs"
              aria-label={desktopSidebarOpen ? 'Tutup sidebar navigasi' : 'Buka sidebar navigasi'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {desktopSidebarOpen ? 'menu_open' : 'menu'}
              </span>
            </button>

            <div className="flex items-center gap-2 text-xs text-[#524344]">
              <span className="material-symbols-outlined text-[16px] text-[#994703]">store</span>
              <span className="font-semibold text-[#1c1c19]">Rawon Gusti Surabaya</span>
              <span className="text-[#847374]">/</span>
              <span className="font-medium">{getViewTitle()}</span>
            </div>
          </div>

          {/* Bantuan Kanan */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="p-2 rounded-lg text-[#524344] hover:bg-[#ebe8e3] hover:text-[#1c1c19] transition-colors cursor-pointer"
              aria-label="Bantuan operasional"
            >
              <span className="material-symbols-outlined text-[18px]">help</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Help Modal */}
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
};
