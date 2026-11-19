/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import {
  MobileHeader,
  MobileBottomNav,
  DesktopSidebar,
  DesktopHeader
} from './components/Navigation';
import { MejaPelangganView } from './components/MejaPelangganView';
import { PesananBaruView } from './components/PesananBaruView';
import { CheckoutView } from './components/CheckoutView';
import { DashboardView } from './components/DashboardView';
import { KelolaMenuView } from './components/KelolaMenuView';
import { KelolaMejaView } from './components/KelolaMejaView';
import { KitchenDisplayView } from './components/KitchenDisplayView';
import { LaporanView } from './components/LaporanView';
import { StaffManagementView } from './components/StaffManagementView';
import { PengaturanView } from './components/PengaturanView';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { QrCodeModal } from './components/QrCodeModal';
import { supabaseConfigured } from '../lib/supabase';
import { SetupNotice } from '../lib/SetupNotice';

const AppContent: React.FC = () => {
  const {
    isLoggedIn,
    authLoading,
    dataReady,
    activeView,
    setActiveView,
    currentRole,
    setCurrentRole,
    viewportMode,
    setViewportMode,
    toast,
    logout,
    desktopSidebarOpen
  } = useApp();


  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-[#524344]">Memuat…</div>;
  }

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  if (!dataReady) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-[#524344]">Memuat data outlet…</div>;
  }

  // Determine which view to render
  const renderCurrentView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'meja-dan-pelanggan':
        return <MejaPelangganView />;
      case 'pesanan-baru':
        return <PesananBaruView />;
      case 'checkout':
      case 'pembayaran':
        return <CheckoutView />;
      case 'pantau-pesanan':
        return <KitchenDisplayView />;
      case 'kelola-menu':
        return <KelolaMenuView />;
      case 'kelola-meja':
        return <KelolaMejaView />;
      case 'akun-staf-dan-role':
        return <StaffManagementView />;
      case 'laporan':
        return <LaporanView />;
      case 'pengaturan':
        return <PengaturanView />;
      default:
        return <MejaPelangganView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f4] text-[#1c1c19] flex flex-col font-sans selection:bg-[#3d1018] selection:text-white">
      {/* Mobile Shell (Hidden on md and larger) */}
      <div className="block md:hidden min-h-screen flex flex-col">
        <MobileHeader />
        <main className="flex-1 pt-16 sm:pt-20 pb-20 bg-[#fcf9f4]">{renderCurrentView()}</main>
        <MobileBottomNav />
      </div>

      {/* Desktop Shell (Hidden on small mobile screens) */}
      <div className="hidden md:flex min-h-screen">
        <DesktopSidebar />
        <div className={`flex-1 ${desktopSidebarOpen ? 'pl-64' : 'pl-0'} flex flex-col min-w-0 transition-all duration-300`}>
          <DesktopHeader />
          <main className="flex-1 pt-16 bg-[#fcf9f4]">{renderCurrentView()}</main>
        </div>
      </div>

      {/* Global Toast Notification (Top Center) */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center justify-center border max-w-[90vw] animate-in fade-in slide-in-from-top-4 duration-200 text-center ${
            toast.type === 'warning'
              ? 'bg-[#ba1a1a] border-[#ffdadc]/30 shadow-[#ba1a1a]/25'
              : toast.type === 'success'
              ? 'bg-[#1b3b22] border-emerald-500/25 shadow-[#1b3b22]/25'
              : 'bg-[#3d1018] border-[#ffdadc]/20 shadow-[#3d1018]/25'
          }`}
        >
          <span className="text-xs font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* Global Thermal Receipt Modal */}
      <ThermalReceiptModal />

      {/* Global QR Code Stand Modal */}
      <QrCodeModal />
    </div>
  );
};

export default function App() {
  if (!supabaseConfigured) return <SetupNotice />;
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
