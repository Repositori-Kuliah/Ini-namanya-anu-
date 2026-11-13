import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';

export interface CustomDatePickerProps {
  id?: string;
  value: string; // ISO format 'YYYY-MM-DD'
  min?: string;
  max?: string;
  onChange: (dateIso: string) => void;
  className?: string;
}

// Konversi ISO '2026-11-12' ke 8 digit angka murni '12112026'
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

// Parse 8 digit '12112026' ke ISO '2026-11-12'
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

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  id,
  value,
  min,
  max,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [digits, setDigits] = useState<string>(() => isoToDigits(value));

  const [viewYear, setViewYear] = useState(() => {
    const parts = (value || '').split('-');
    return parseInt(parts[0], 10) || new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const parts = (value || '').split('-');
    return (parseInt(parts[1], 10) || (new Date().getMonth() + 1)) - 1;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useLayoutEffect(() => {
    if (inputRef.current && document.activeElement === inputRef.current) {
      updateCaretPosition(digits.length);
    }
  }, [digits]);

  useEffect(() => {
    setDigits(isoToDigits(value));
    const parts = (value || '').split('-');
    if (parts.length === 3) {
      setViewYear(parseInt(parts[0], 10));
      setViewMonth(parseInt(parts[1], 10) - 1);
    }
  }, [value]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      setDigits((prev) => {
        const next = prev.slice(0, -1);
        updateCaretPosition(next.length);
        return next;
      });
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      setDigits('');
      updateCaretPosition(0);
      return;
    }

    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      setDigits((prev) => {
        if (prev.length >= 8) return prev;
        const next = prev + e.key;
        updateCaretPosition(next.length);

        if (next.length === 8) {
          const iso = digitsToIso(next);
          if (iso) {
            if (min && iso < min) return prev;
            if (max && iso > max) return prev;
            onChange(iso);
            const parts = iso.split('-');
            setViewYear(parseInt(parts[0], 10));
            setViewMonth(parseInt(parts[1], 10) - 1);
          }
        }
        return next;
      });
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData('text');
    const pastedDigits = pasteText.replace(/\D/g, '').slice(0, 8);
    if (pastedDigits.length > 0) {
      setDigits(pastedDigits);
      updateCaretPosition(pastedDigits.length);
      if (pastedDigits.length === 8) {
        const iso = digitsToIso(pastedDigits);
        if (iso) {
          if (min && iso < min) return;
          if (max && iso > max) return;
          onChange(iso);
        }
      }
    }
  };

  const handleFocus = () => {
    updateCaretPosition(digits.length);
  };

  const handleClick = () => {
    updateCaretPosition(digits.length);
  };

  const handleBlur = () => {
    if (digits.length < 8) {
      setDigits(isoToDigits(value));
    } else {
      const iso = digitsToIso(digits);
      if (iso && (!min || iso >= min) && (!max || iso <= max)) {
        onChange(iso);
      } else {
        setDigits(isoToDigits(value));
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

    if (min && iso < min) return;
    if (max && iso > max) return;

    onChange(iso);
    setDigits(`${dayStr}${monthStr}${viewYear}`);
    setIsOpen(false);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Container Kapsul Tanggal (Bersih, Rata, Tanpa Aura, Sesuai Desain Dashboard) */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#ebe8e3] focus-within:border-[#3d1018] rounded-xl transition-colors w-full">
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

        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          value={renderMask(digits)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onClick={handleClick}
          className="font-mono tabular-nums text-xs font-bold tracking-wider text-[#1c1c19] text-center bg-transparent outline-none cursor-text flex-1 min-w-0 selection:bg-[#3d1018] selection:text-white"
        />
      </div>

      {/* Popover Kalender Visual */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pemilih Tanggal Kalender"
          className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl p-4 shadow-xl border border-[#ebe8e3] w-72 animate-in fade-in zoom-in-95 duration-150"
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

              const isSelected = dayIso === value;
              const isToday = max ? dayIso === max : false;
              const isOut = (min && dayIso < min) || (max && dayIso > max);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={Boolean(isOut)}
                  onClick={() => handleSelectDay(day)}
                  className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#3d1018] text-white shadow-xs font-bold scale-105'
                      : isToday
                      ? 'bg-[#ffdbc9] text-[#753400] font-bold border border-[#fc934f]'
                      : isOut
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
                const todayIso = max || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
                onChange(todayIso);
                setDigits(isoToDigits(todayIso));
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
