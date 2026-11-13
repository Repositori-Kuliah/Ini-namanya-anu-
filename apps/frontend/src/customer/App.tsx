import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MenuScreen } from './components/MenuScreen';
import { DetailScreen } from './components/DetailScreen';
import { CartScreen } from './components/CartScreen';
import { StatusScreen } from './components/StatusScreen';
import { ChangeTableModal } from './components/ChangeTableModal';
import { Toast } from './components/Toast';
import { supabaseConfigured } from '../lib/supabase';
import { SetupNotice } from '../lib/SetupNotice';

const Notice: React.FC<{ icon: string; title: string; body: string }> = ({ icon, title, body }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-8 min-h-screen">
    <div className="w-14 h-14 rounded-2xl bg-[#f0ede9] text-[#994703] flex items-center justify-center shadow-xs border border-[#ebe8e3]">
      <span className="material-symbols-outlined text-3xl" aria-hidden="true">{icon}</span>
    </div>
    <h1 className="font-serif text-2xl font-bold text-[#3d1018] mt-1">{title}</h1>
    <p className="font-sans text-xs text-[#524344] max-w-xs leading-relaxed">{body}</p>
  </div>
);

const AppContent: React.FC = () => {
  const { currentScreen, tableState } = useApp();

  return (
    <div className="min-h-screen bg-[#fcf9f4] md:bg-[#f6f3ee] flex flex-col items-center justify-start text-[#1c1c19] font-sans selection:bg-[#3d1018] selection:text-white">
      <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl bg-[#fcf9f4] min-h-screen relative flex flex-col md:border-x md:border-[#ebe8e3] md:shadow-xs">
        {tableState === 'loading' && <Notice icon="hourglass_top" title="Memuat menu…" body="Sebentar ya, kami menyiapkan menu untuk meja Anda." />}
        {tableState === 'invalid' && <Notice icon="qr_code_scanner" title="QR meja tidak dikenali" body="Silakan pindai ulang kode QR yang ada di meja Anda, atau minta bantuan pelayan." />}
        {tableState === 'error' && <Notice icon="cloud_off" title="Tidak dapat terhubung" body="Periksa koneksi internet Anda lalu muat ulang halaman ini." />}
        {tableState === 'ok' && (
          <>
            <Header />
            <main className="flex-1 w-full flex flex-col relative">
              {currentScreen === 'welcome' && <WelcomeScreen />}
              {currentScreen === 'menu' && <MenuScreen />}
              {currentScreen === 'detail' && <DetailScreen />}
              {currentScreen === 'cart' && <CartScreen />}
              {currentScreen === 'status' && <StatusScreen />}
            </main>
            <BottomNav />
            <ChangeTableModal />
          </>
        )}
        <Toast />
      </div>
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
