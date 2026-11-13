import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f6f3f0] text-[#302526] flex flex-col justify-between selection:bg-[#64272e] selection:text-white"
      style={{
        backgroundImage:
          "linear-gradient(rgba(246, 243, 240, 0.78), rgba(246, 243, 240, 0.78)), url('/batik-rawon.jpeg')",
        backgroundSize: 'auto, 280px',
        backgroundRepeat: 'repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header (72px) Bersih */}
      <header className="flex h-[72px] items-center justify-between border-b border-[#e8dfd9] bg-white px-4 sm:px-6 md:px-10 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/logo-rawon.png"
            alt="Logo Rawon Gusti"
            className="h-10 w-10 rounded-lg object-contain"
          />
          <div>
            <h1 className="text-base font-bold leading-tight text-[#64272e]">Rawon Gusti</h1>
            <p className="text-[11px] text-[#8b7d79]">Rasa asli, sepenuh hati.</p>
          </div>
        </div>
      </header>

      {/* Main Content (Centered single login card) */}
      <main className="mx-auto flex w-full max-w-[480px] flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full">
          <section className="flex items-center justify-center">
            <div className="w-full max-w-[460px] rounded-2xl border border-[#e8dfd9] bg-white p-6 shadow-[0_8px_30px_rgba(48,34,36,0.06)] sm:p-8">
              <h2 className="text-2xl font-serif font-bold leading-tight tracking-tight text-[#302526] sm:text-[27px]">
                Selamat datang kembali
              </h2>

              {/* Error Banner */}
              {errorMsg && (
                <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold block">{errorMsg}</span>
                    <span className="text-[11px] opacity-90">Periksa kembali kredensial Anda atau hubungi admin outlet.</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 sm:space-y-4">
                {/* Email / Username */}
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[#302526]">
                    Email atau username
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email atau username"
                    required
                    className="h-10.5 w-full rounded-lg border border-[#e6dcd6] px-3.5 text-xs sm:text-sm outline-none transition placeholder:text-[#938782] focus:border-[#64272e] focus:ring-2 focus:ring-[#64272e]/10 text-[#302526]"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-[#302526]">
                    Kata sandi
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      required
                      className="h-10.5 w-full rounded-lg border border-[#e6dcd6] px-3.5 pr-11 text-xs sm:text-sm outline-none transition placeholder:text-[#938782] focus:border-[#64272e] focus:ring-2 focus:ring-[#64272e]/10 text-[#302526]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#897c78] hover:text-[#64272e] transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-[#302526]">
                    <input
                      type="checkbox"
                      id="remember"
                      name="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 cursor-pointer accent-[#64272e] rounded"
                    />
                    <span>Ingat saya</span>
                  </label>
                </div>

                <p className="text-[11px] leading-5 text-[#897c78]">
                  Gunakan &ldquo;Ingat saya&rdquo; hanya di perangkat pribadi.
                </p>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-1 h-10.5 w-full rounded-lg bg-[#64272e] text-xs sm:text-sm font-semibold text-white transition hover:bg-[#502027] focus:outline-none focus:ring-2 focus:ring-[#64272e]/30 focus:ring-offset-2 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-60 flex items-center justify-center"
                >
                  {busy ? 'Memproses…' : 'Masuk'}
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>

      <footer className="py-5 text-center text-xs font-medium text-[#524344]">
        &copy; {new Date().getFullYear()} Rawon Gusti &bull; Sistem Point of Sale Restoran
      </footer>
    </div>
  );
};
