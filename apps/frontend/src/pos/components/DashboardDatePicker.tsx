import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';

interface DashboardDatePickerProps {
  dateFrom: string;
  dateTo: string;
  maxDate: string;
  onSelectDate: (dateIso: string) => void;
}

// Konversi ISO '2026-11-11' ke 8 digit angka murni '11112026'
const isoToDigits = (iso: string): string => {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return '';
  const [y, m, d] = parts;
  return `${d.padStart(2, '0')}${m.padStart(2, '0')}${y}`;
};

// Render format mask 'DD / MM / YYYY' dari digit yang diketik
const renderMask = (digits: string): string => {
  const d1 = digits[0] || 'D';
  const d2 = digits[1] || 'D';
  const m1 = digits[2] || 'M';
  const m2 = digits[3] || 'M';
  const y1 = digits[4] || 'Y';
  const y2 = digits[5] || 'Y';
  const y3 = digits[6] || 'Y';
  const y4 = digits[7] || 'Y';

  return `${d1}${d2} / ${m1}${m2} / ${y1}${y2}${y3}${y4}`;
};

// Parse 8 digit '11112026' ke ISO '2026-11-11'
const digitsToIso = (digits: string): string | null => {
  if (digits.length !== 8) return null;
  const d = parseInt(digits.slice(0, 2), 10);
  const m = parseInt(digits.slice(2, 4), 10);
  const y = parseInt(digits.slice(4, 8), 10);

  if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 2000 && y <= 2100) {
    const daysInMonth = new Date(y, m, 0).getDate();
    const clampedDay = Math.min(d, daysInMonth);
    return `${y}-${String(m).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
  }
  return null;
};

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const DashboardDatePicker: React.FC<DashboardDatePickerProps> = ({
  dateFrom,
  dateTo,
  maxDate,
  onSelectDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isSingle = dateFrom === dateTo;
  const currentIso = isSingle ? dateFrom : dateTo;

  // 8 digit angka murni: misal '11112026', atau '' yang tampil sebagai '-- / -- / ----'
  const [digits, setDigits] = useState<string>(() => (isSingle ? isoToDigits(dateFrom) : ''));
  const [isRangeView, setIsRangeView] = useState<boolean>(!isSingle);

  // Bulan dan tahun tampilan kalender popover
  const [viewYear, setViewYear] = useState(() => {
    const parts = (isSingle ? dateFrom : dateTo).split('-');
    return parseInt(parts[0], 10) || new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const parts = (isSingle ? dateFrom : dateTo).split('-');
    return (parseInt(parts[1], 10) || (new Date().getMonth() + 1)) - 1;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Posisi kursor/caret karakter di dalam format mask '-- / -- / ----'
  // Index: 0 1  2 3 4  5 6  7 8 9  10 11 12 13
  // Char:  d d  ' / '  m m  ' / '   y  y  y  y
  const CARET_POSITIONS = [0, 1, 5, 6, 10, 11, 12, 13, 14];

  const updateCaretPosition = (digitCount: number) => {
    if (!inputRef.current) return;
    const clampedCount = Math.max(0, Math.min(digitCount, 8));
    const targetPos = CARET_POSITIONS[clampedCount];
    requestAnimationFrame(() => {
      if (inputRef.current && document.activeElement === inputRef.current) {
        inputRef.current.setSelectionRange(targetPos, targetPos);
      }
    });
  };

  // Sinkronkan posisi garis kursor setiap kali digit berubah saat input aktif
  useLayoutEffect(() => {
    if (inputRef.current && document.activeElement === inputRef.current && !isRangeView) {
      updateCaretPosition(digits.length);
    }
  }, [digits, isRangeView]);

  // Sinkronkan saat dateFrom / dateTo berubah dari luar
  useEffect(() => {
    if (dateFrom === dateTo) {
      setDigits(isoToDigits(dateFrom));
      setIsRangeView(false);
      const parts = dateFrom.split('-');
      if (parts.length === 3) {
        setViewYear(parseInt(parts[0], 10));
        setViewMonth(parseInt(parts[1], 10) - 1);
      }
    } else {
      setIsRangeView(true);
      setDigits(isoToDigits(dateTo));
    }
  }, [dateFrom, dateTo]);

  // Tutup kalender saat klik di luar atau tekan Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Mengetik nomor dari kiri ke kanan: tanda '-- / -- / ----' tetap ada dan kursor selalu mengikuti
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace: hapus satu digit terakhir, kursor langsung mundur mengikuti angka yang terhapus
    if (e.key === 'Backspace') {
      e.preventDefault();
      setIsRangeView(false);
      setDigits((prev) => {
        const next = prev.slice(0, -1);
        updateCaretPosition(next.length);
        return next;
      });
      return;
    }

    // Delete: hapus semua digit sekaligus kembali ke '-- / -- / ----', kursor kembali ke awal
    if (e.key === 'Delete') {
      e.preventDefault();
      setIsRangeView(false);
      setDigits('');
      updateCaretPosition(0);
      return;
    }

    // Hanya terima input angka 0-9
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      setIsRangeView(false);
      setDigits((prev) => {
        if (prev.length >= 8) return prev; // Maksimal 8 digit (HH/BB/TTTT)
        const next = prev + e.key;
        updateCaretPosition(next.length);

        // Jika sudah lengkap 8 digit, langsung periksa dan aktifkan tanggal
        if (next.length === 8) {
          const iso = digitsToIso(next);
          if (iso && iso <= maxDate) {
            onSelectDate(iso);
            const parts = iso.split('-');
            setViewYear(parseInt(parts[0], 10));
            setViewMonth(parseInt(parts[1], 10) - 1);
          }
        }
        return next;
      });
    }
  };

  // Dukungan paste teks angka
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData('text');
    const pastedDigits = pasteText.replace(/\D/g, '').slice(0, 8);
    if (pastedDigits.length > 0) {
      setIsRangeView(false);
      setDigits(pastedDigits);
      updateCaretPosition(pastedDigits.length);
      if (pastedDigits.length === 8) {
        const iso = digitsToIso(pastedDigits);
        if (iso && iso <= maxDate) {
          onSelectDate(iso);
        }
      }
    }
  };

  const handleFocus = () => {
    if (isRangeView) {
      setIsRangeView(false);
      const d = isoToDigits(dateTo);
      setDigits(d);
      updateCaretPosition(d.length);
    } else {
      updateCaretPosition(digits.length);
    }
  };

  const handleClick = () => {
    if (!isRangeView) {
      updateCaretPosition(digits.length);
    }
  };

  const handleBlur = () => {
    // Jika belum lengkap 8 digit atau kosong saat keluar, kembalikan ke tanggal aktif
    if (digits.length < 8) {
      setDigits(isoToDigits(currentIso));
    } else {
      const iso = digitsToIso(digits);
      if (iso && iso <= maxDate) {
        onSelectDate(iso);
      } else {
        setDigits(isoToDigits(currentIso));
      }
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const iso = `${viewYear}-${monthStr}-${dayStr}`;

    if (iso > maxDate) return;

    onSelectDate(iso);
    setDigits(`${dayStr}${monthStr}${viewYear}`);
    setIsRangeView(false);
    setIsOpen(false);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  // Teks yang ditampilkan dalam input
  const displayValue = isRangeView
    ? `${renderMask(isoToDigits(dateFrom))} – ${renderMask(isoToDigits(dateTo))}`
    : renderMask(digits);

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Container Kapsul Tanggal (Bersih, Rata, Tanpa Aura, Tanpa Shadow/Ring) */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#ebe8e3] focus-within:border-[#3d1018] rounded-xl transition-colors">
        {/* Tombol Kalender Popover (Kiri) */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Tampilkan kalender"
          className="text-[#7d7571] hover:text-[#3d1018] flex items-center justify-center shrink-0 transition-colors cursor-pointer focus-visible:outline-none"
        >
          <span className="material-symbols-outlined text-[17px]">
            {isOpen ? 'expand_less' : 'calendar_month'}
          </span>
        </button>

        {/* Input Tanggal dengan Mask Tetap: dihapus jadi '-- / -- / ----' dan kursor selalu mengikuti */}
        <input
          ref={inputRef}
          id="dash-unified-date"
          type="text"
          inputMode="numeric"
          value={displayValue}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onClick={handleClick}
          readOnly={false}
          className="font-mono tabular-nums text-xs font-bold tracking-wider text-[#1c1c19] text-center bg-transparent outline-none cursor-text w-32 selection:bg-[#3d1018] selection:text-white"
        />
      </div>

      {/* Popover Kalender Visual */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pemilih Tanggal Kalender"
          className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl p-4 shadow-xl border border-[#ebe8e3] w-72 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Kalender */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#f0ede9]">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Bulan sebelumnya"
              className="w-7 h-7 rounded-lg bg-[#f6f3ee] hover:bg-[#3d1018] hover:text-white text-[#1c1c19] flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>

            <span className="font-serif font-bold text-xs text-[#3d1018]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Bulan berikutnya"
              className="w-7 h-7 rounded-lg bg-[#f6f3ee] hover:bg-[#3d1018] hover:text-white text-[#1c1c19] flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          {/* Nama Hari */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {DAY_NAMES.map((d) => (
              <span key={d} className="text-[10px] font-bold text-[#847374] uppercase tracking-wider">
                {d}
              </span>
            ))}
          </div>

          {/* Grid Tanggal */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="w-8 h-8" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const monthStr = String(viewMonth + 1).padStart(2, '0');
              const dayStr = String(day).padStart(2, '0');
              const dayIso = `${viewYear}-${monthStr}-${dayStr}`;

              const isSelected = isSingle && dayIso === dateFrom;
              const isToday = dayIso === maxDate;
              const isFuture = dayIso > maxDate;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isFuture}
                  onClick={() => handleSelectDay(day)}
                  className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#3d1018] text-white shadow-xs font-bold scale-105'
                      : isToday
                      ? 'bg-[#ffdbc9] text-[#753400] font-bold border border-[#fc934f]'
                      : isFuture
                      ? 'text-[#d7c2c2] cursor-not-allowed opacity-30'
                      : 'text-[#1c1c19] hover:bg-[#f6f3ee] font-medium'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Footer */}
          <div className="mt-3 pt-2.5 border-t border-[#f0ede9] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                onSelectDate(maxDate);
                setDigits(isoToDigits(maxDate));
                setIsRangeView(false);
                setIsOpen(false);
              }}
              className="text-[#994703] font-bold hover:underline cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#524344] hover:text-[#1c1c19] font-medium cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
