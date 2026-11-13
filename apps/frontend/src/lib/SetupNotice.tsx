import React from 'react';
import { enableDemoMode } from './supabase';

export const SetupNotice: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fcf9f4] flex items-center justify-center p-4 font-sans text-[#1c1c19]">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-xl border border-[#ebe8e3] space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-[#ebe8e3]">
          <div className="w-12 h-12 rounded-2xl bg-[#3d1018] text-[#ffdadc] flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-[28px]">soup_kitchen</span>
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-[#3d1018] leading-tight">
              Rawon Gusti Surabaya
            </h1>
            <p className="text-xs text-[#524344]">Sistem POS &amp; Pemesanan QR Meja</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-[#1c1c19] font-medium leading-relaxed">
            Selamat datang! Anda dapat langsung menjelajahi seluruh fitur POS kasir, dapur KDS, dan pemesanan QR pelanggan dalam <strong>Mode Demo Instant</strong> tanpa perlu konfigurasi database awal.
          </p>

          <div className="p-3.5 bg-[#fcf9f4] rounded-2xl border border-[#ebe8e3] space-y-2">
            <span className="text-xs font-bold text-[#994703] uppercase tracking-wider block">
              Akun Demo Siap Pakai:
            </span>
            <ul className="text-xs text-[#524344] space-y-1">
              <li>• <strong>Admin:</strong> admin@rawongusti.test</li>
              <li>• <strong>Kasir:</strong> kasir@rawongusti.test</li>
              <li>• <strong>Dapur KDS:</strong> dapur@rawongusti.test</li>
              <li className="text-[11px] text-[#847374] pt-1 italic">(Password untuk semua akun: <code>password123</code>)</li>
            </ul>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={enableDemoMode}
            className="w-full h-12 bg-[#3d1018] hover:bg-[#58252c] text-white font-bold text-sm rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Mulai Mode Demo Instant</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>

          <p className="text-center text-[11px] text-[#524344]">
            Ingin menghubungkan Supabase Anda sendiri? Salin <code>.env.example</code> ke <code>.env</code> dan isi <code>VITE_SUPABASE_URL</code>.
          </p>
        </div>
      </div>
    </div>
  );
};
