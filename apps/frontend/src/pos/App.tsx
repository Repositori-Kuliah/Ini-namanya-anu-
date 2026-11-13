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

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed top-20 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-auto z-50 bg-[#3d1018] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#ffdadc]/20 animate-in slide-in-from-top-4 duration-200">
          <span className="material-symbols-outlined text-[#fc934f] text-[20px]">
            {toast.type === 'success'
              ? 'check_circle'
              : toast.type === 'warning'
              ? 'warning'
              : 'notifications_active'}
          </span>
          <span className="text-xs font-semibold">{toast.message}</span>
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
