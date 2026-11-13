import React, { useState, useEffect, useRef } from 'react';

interface DashboardDatePickerProps {
  dateFrom: string;
  dateTo: string;
  maxDate: string;
  onSelectDate: (dateIso: string) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Format ISO string 'YYYY-MM-DD' ke format 'DD/MM/YYYY' bersih tanpa spasi ganjil
const isoToFormatted = (iso: string): string => {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
};

// Parse 'DD/MM/YYYY' ke 'YYYY-MM-DD'
const formattedToIso = (formatted: string): string | null => {
  const clean = formatted.trim();
  const match = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!match) return null;
  const d = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const y = parseInt(match[3], 10);

  if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 2000 && y <= 2100) {
    const daysInMonth = new Date(y, m, 0).getDate();
    const clampedDay = Math.min(d, daysInMonth);
    return `${y}-${String(m).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
  }
  return null;
};

export const DashboardDatePicker: React.FC<DashboardDatePickerProps> = ({
  dateFrom,
  dateTo,
  maxDate,
  onSelectDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isSingle = dateFrom === dateTo;

  // Input teks editable bebas: pengguna dapat mengedit bagian Day, Month, atau Year di posisi mana saja
  const [inputValue, setInputValue] = useState<string>(() => isoToFormatted(dateTo));

  // Bulan dan tahun popover kalender
  const [viewYear, setViewYear] = useState(() => {
    const parts = dateTo.split('-');
    return parseInt(parts[0], 10) || new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const parts = dateTo.split('-');
    return (parseInt(parts[1], 10) || (new Date().getMonth() + 1)) - 1;
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Sinkronkan saat dateTo berubah dari luar (misal memilih preset 1 Hari, 1 Minggu, 1 Bulan, dsb)
  useEffect(() => {
    setInputValue(isoToFormatted(dateTo));
    const parts = dateTo.split('-');
    if (parts.length === 3) {
      setViewYear(parseInt(parts[0], 10));
      setViewMonth(parseInt(parts[1], 10) - 1);
    }
  }, [dateTo, dateFrom]);

  // Tutup kalender saat klik di luar
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    // Otomatis terapkan jika tanggal valid
    const iso = formattedToIso(val);
    if (iso && iso <= maxDate) {
      onSelectDate(iso);
      const parts = iso.split('-');
      setViewYear(parseInt(parts[0], 10));
      setViewMonth(parseInt(parts[1], 10) - 1);
    }
  };

  const handleBlur = () => {
    const iso = formattedToIso(inputValue);
    if (iso && iso <= maxDate) {
      onSelectDate(iso);
      setInputValue(isoToFormatted(iso));
    } else {
      setInputValue(isoToFormatted(dateTo));
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
    setInputValue(`${dayStr}/${monthStr}/${viewYear}`);
    setIsOpen(false);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Container Kapsul Tanggal (Bersih, Rata, Tanpa Spasi Tak Terlihat) */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#ebe8e3] focus-within:border-[#3d1018] rounded-xl transition-colors">
        {/* Tombol Kalender Popover */}
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

        {/* Input Tanggal: Pengguna bebas mengedit Day, Month, atau Year tanpa kendala caret */}
        <input
          id="dash-unified-date"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="DD/MM/YYYY"
          className="font-mono tabular-nums text-xs font-bold tracking-wider text-[#1c1c19] text-center bg-transparent outline-none cursor-text w-28 selection:bg-[#3d1018] selection:text-white"
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
              const cellIso = `${viewYear}-${monthStr}-${dayStr}`;
              const isSelected = cellIso === dateTo;
              const isDisabled = cellIso > maxDate;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDay(day)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#3d1018] text-white font-bold shadow-xs'
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

          {/* Quick Footer */}
          <div className="mt-3 pt-2.5 border-t border-[#f0ede9] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                onSelectDate(maxDate);
                setInputValue(isoToFormatted(maxDate));
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
