import React, { useState, useEffect, useRef } from 'react';

export interface CustomDatePickerProps {
  id?: string;
  value: string; // ISO format 'YYYY-MM-DD'
  min?: string;
  max?: string;
  onChange: (dateIso: string) => void;
  className?: string;
  align?: 'left' | 'right';
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const isoToDisplay = (iso: string): string => {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
};

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  id,
  value,
  min,
  max,
  onChange,
  className = '',
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');

  const [viewYear, setViewYear] = useState(() => {
    const parts = (value || '').split('-');
    return parseInt(parts[0], 10) || new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const parts = (value || '').split('-');
    return (parseInt(parts[1], 10) || (new Date().getMonth() + 1)) - 1;
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
        setViewMode('days');
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setViewMode('days');
      }
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

  const handlePrevMonth = () => {
    if (viewMode === 'years') {
      setViewYear((y) => y - 12);
      return;
    }
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMode === 'years') {
      setViewYear((y) => y + 12);
      return;
    }
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

    if (max && iso > max) return;
    if (min && iso < min) return;

    onChange(iso);
    setIsOpen(false);
    setViewMode('days');
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const todayIso = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });

  // Generate 12 years around current viewYear
  const yearStart = Math.floor(viewYear / 12) * 12;
  const yearsList = Array.from({ length: 12 }, (_, i) => yearStart + i);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Tombol Pemilih Tanggal (DD/MM/YYYY) */}
      <button
        id={id}
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setViewMode('days');
        }}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#ebe8e3] hover:border-[#3d1018] rounded-xl text-xs font-bold text-[#1c1c19] transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus:border-[#3d1018]"
        aria-label="Pilih tanggal laporan"
      >
        <span className="font-mono tracking-wider tabular-nums">
          {isoToDisplay(value)}
        </span>
        <span className="material-symbols-outlined text-[15px] text-[#847374]">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Popover Kalender Visual */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-2xs sm:hidden"
            onClick={() => {
              setIsOpen(false);
              setViewMode('days');
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Kalender Pemilih Tanggal"
            className={`fixed inset-x-4 top-1/2 -translate-y-1/2 sm:translate-y-0 sm:inset-auto sm:top-full ${
              align === 'right' ? 'sm:right-0 sm:left-auto' : 'sm:left-0 sm:right-auto'
            } sm:mt-2 z-50 bg-white rounded-2xl p-4 shadow-2xl sm:shadow-xl border border-[#ebe8e3] w-auto max-w-[320px] mx-auto sm:mx-0 sm:w-76 animate-in fade-in zoom-in-95 duration-150 sm:absolute`}
          >
          {/* Header Kalender */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#f0ede9]">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Sebelumnya"
              className="w-7 h-7 rounded-lg bg-[#f6f3ee] hover:bg-[#3d1018] hover:text-white text-[#1c1c19] flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'months' ? 'days' : 'months')}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  viewMode === 'months'
                    ? 'bg-[#3d1018] text-white'
                    : 'text-[#3d1018] hover:bg-[#3d1018]/10'
                }`}
              >
                {MONTH_NAMES[viewMonth]}
              </button>
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  viewMode === 'years'
                    ? 'bg-[#3d1018] text-white'
                    : 'text-[#3d1018] hover:bg-[#3d1018]/10'
                }`}
              >
                {viewYear}
              </button>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Berikutnya"
              className="w-7 h-7 rounded-lg bg-[#f6f3ee] hover:bg-[#3d1018] hover:text-white text-[#1c1c19] flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          {/* Mode Pemilihan Bulan */}
          {viewMode === 'months' && (
            <div className="grid grid-cols-3 gap-2 py-2">
              {MONTH_NAMES.map((m, idx) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setViewMonth(idx);
                    setViewMode('days');
                  }}
                  className={`py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    idx === viewMonth
                      ? 'bg-[#3d1018] text-white shadow-xs'
                      : 'hover:bg-[#f6f3ee] text-[#1c1c19]'
                  }`}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {/* Mode Pemilihan Tahun */}
          {viewMode === 'years' && (
            <div className="grid grid-cols-3 gap-2 py-2">
              {yearsList.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setViewYear(y);
                    setViewMode('days');
                  }}
                  className={`py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    y === viewYear
                      ? 'bg-[#3d1018] text-white shadow-xs'
                      : 'hover:bg-[#f6f3ee] text-[#1c1c19]'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Mode Kalender Hari */}
          {viewMode === 'days' && (
            <>
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
                  const cellIso = `${viewYear}-${monthStr}-${dayStr}`;

                  const isSelected = cellIso === value;
                  const isToday = cellIso === todayIso;
                  const isDisabled = (max && cellIso > max) || (min && cellIso < min);

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={Boolean(isDisabled)}
                      onClick={() => handleSelectDay(day)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#3d1018] text-white font-bold shadow-xs'
                          : isToday
                          ? 'bg-[#ffdbc9] text-[#753400] font-bold border border-[#fc934f]'
                          : isDisabled
                          ? 'text-[#c5bcb5] cursor-not-allowed opacity-40'
                          : 'hover:bg-[#f6f3ee] text-[#1c1c19]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Quick Footer */}
          <div className="mt-3 pt-2.5 border-t border-[#f0ede9] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                const target = max && todayIso > max ? max : todayIso;
                onChange(target);
                setIsOpen(false);
                setViewMode('days');
              }}
              className="text-[#994703] font-bold hover:underline cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setViewMode('days');
              }}
              className="text-[#524344] hover:text-[#1c1c19] font-medium cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
};
