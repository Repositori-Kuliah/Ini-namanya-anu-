import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff } from 'lucide-react';
import { publicAsset } from '../../lib/publicAsset';
import heroRawonImg from '../../assets/images/hero_rawon_daging_1794405798124.jpg';

export const LoginScreen: React.FC = () => {
  const { login } = useApp();

  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('pos.lastLoginId') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return Boolean(localStorage.getItem('pos.lastLoginId'));
    } catch {
      return false;
    }
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Email dan kata sandi wajib diisi.');
      return;
    }
    setBusy(true);
    setErrorMsg('');
    const err = await login(email.trim(), password);
    setBusy(false);
    if (err) {
      setErrorMsg(err);
    } else {
      try {
        if (rememberMe) {
          localStorage.setItem('pos.lastLoginId', email.trim());
        } else {
          localStorage.removeItem('pos.lastLoginId');
        }
      } catch {
        // Ignore localStorage errors (e.g. storage disabled or quota exceeded)
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#fcf9f4] text-[#1c1c19] selection:bg-[#3d1018] selection:text-white">
      {/* =========================================================================
          LEFT HERO PANEL (Tampil di Desktop / Tablet Lebar)
          Menampilkan Hero Foto Makanan Signature & Tipografi Elegan
         ========================================================================= */}
      <aside className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 lg:p-14 overflow-hidden select-none">
        {/* Background Food Photography */}
        <img
          src={(heroRawonImg as any)?.src || (heroRawonImg as any)}
          alt="Rawon Daging Signature Rawon Gusti"
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />

        {/* Gradient Shadow Overlay untuk Kontras Teks Maksimal */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/60" />

        {/* Header Branding Kiri Atas (Tanpa Logo) */}
        <div className="relative z-10 flex items-center gap-3">
          <div>
            <h2 className="font-bold text-base text-white leading-tight">Rawon Gusti</h2>
            <p className="text-[11px] text-white/70">Surabaya</p>
          </div>
        </div>

        {/* Quote & Value Proposition Kiri Bawah */}
        <div className="relative z-10 space-y-3.5">
          <h1 className="font-serif text-3xl xl:text-4xl font-bold tracking-tight text-white leading-tight">
            Rasa asli,<br />sepenuh hati.
          </h1>
          <p className="text-xs xl:text-sm text-white/80 max-w-md leading-relaxed">
            Satu meja, satu pesanan, satu shift. Kelola layanan Rawon Gusti Surabaya dari sini.
          </p>
          <p className="text-[11px] text-white/50 pt-3">
            &copy; {new Date().getFullYear()} Rawon Gusti Surabaya
          </p>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT AUTH PANEL (Tampil di Semua Layar)
          Form Login Bersih & Responsif
         ========================================================================= */}
      <main className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-[#fcf9f4]">
        {/* Mobile Header Branding (Tanpa Logo) */}
        <div className="flex lg:hidden items-center gap-3 pt-2">
          <div>
            <h2 className="font-bold text-base text-[#1c1c19] leading-tight">Rawon Gusti</h2>
            <p className="text-[11px] text-[#847374]">Rasa asli, sepenuh hati.</p>
          </div>
        </div>

        {/* Center Login Form Container */}
        <div className="w-full max-w-sm mx-auto my-auto py-8 space-y-6">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1c1c19] tracking-tight">
              Selamat datang kembali
            </h2>
            <p className="text-xs sm:text-sm text-[#524344] mt-1.5">
              Masuk untuk membuka shift dan mulai melayani.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Email atau Username */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#1c1c19] mb-1.5">
                Email atau Username
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Masukkan email atau username"
                required
                className="h-11 w-full rounded-xl border border-[#ebe8e3] bg-white px-3.5 text-xs sm:text-sm text-[#1c1c19] outline-none transition placeholder:text-[#847374] focus:border-[#3d1018] shadow-2xs"
              />
            </div>

            {/* Input Kata Sandi */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[#1c1c19] mb-1.5">
                Kata sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Masukkan kata sandi"
                  required
                  className="h-11 w-full rounded-xl border border-[#ebe8e3] bg-white px-3.5 pr-11 text-xs sm:text-sm text-[#1c1c19] outline-none transition placeholder:text-[#847374] focus:border-[#3d1018] shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#847374] hover:text-[#1c1c19] transition-colors p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errorMsg && (
                <p className="text-xs text-[#ba1a1a] mt-1.5 font-medium animate-in fade-in">
                  {errorMsg}
                </p>
              )}
            </div>

            {/* Ingat Saya Checkbox */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="checkbox"
                id="remember"
                name="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-[#3d1018] rounded"
              />
              <label htmlFor="remember" className="text-xs text-[#524344] cursor-pointer">
                Ingat saya
              </label>
            </div>

            {/* Tombol Masuk Maroon */}
            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-xl bg-[#3d1018] hover:bg-[#58252c] text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? 'Memproses…' : 'Masuk'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-[#847374] lg:hidden">
          &copy; {new Date().getFullYear()} Rawon Gusti &bull; Sistem Point of Sale Restoran
        </footer>
      </main>
    </div>
  );
};
