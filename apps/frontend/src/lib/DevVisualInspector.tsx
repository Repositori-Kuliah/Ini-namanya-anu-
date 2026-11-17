import React, { useState, useEffect, useRef } from 'react';
import { MousePointerClick, Copy, Check, X, Sparkles, Edit3, EyeOff, RotateCcw } from 'lucide-react';

export const DevVisualInspector: React.FC = () => {
  // Hanya aktif di environment development (Vite dev)
  if (!import.meta.env.DEV) {
    return null;
  }

  const [isActive, setIsActive] = useState(false);
  const [selectedEl, setSelectedEl] = useState<HTMLElement | null>(null);
  const [hoveredEl, setHoveredEl] = useState<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [boxRect, setBoxRect] = useState<DOMRect | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle dengan shortcut keyboard Alt + I
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        setIsActive((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Tracking hover & click saat inspektur aktif
  useEffect(() => {
    if (!isActive) {
      setHoveredEl(null);
      return;
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (containerRef.current?.contains(target)) return;
      setHoveredEl(target);
      setBoxRect(target.getBoundingClientRect());
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (containerRef.current?.contains(target)) return;

      e.preventDefault();
      e.stopPropagation();

      setSelectedEl(target);
      setOriginalText(target.innerText?.trim() || '');
      setInstruction('');
      setCopied(false);
    };

    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('click', handleClick, true);
    };
  }, [isActive]);

  const handleMakeEditable = () => {
    if (!selectedEl) return;
    selectedEl.contentEditable = 'true';
    selectedEl.focus();
    // Styling highlight editing
    selectedEl.style.outline = '2px dashed #f59e0b';
    selectedEl.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';

    const handleBlur = () => {
      selectedEl.style.outline = '';
      selectedEl.style.backgroundColor = '';
      selectedEl.removeEventListener('blur', handleBlur);
    };
    selectedEl.addEventListener('blur', handleBlur);
  };

  const handleHideElement = () => {
    if (!selectedEl) return;
    selectedEl.style.display = 'none';
    setSelectedEl(null);
  };

  const handleCopyPrompt = () => {
    if (!selectedEl) return;
    const tagName = selectedEl.tagName.toLowerCase();
    const textSnippet = (selectedEl.innerText || '').slice(0, 100).replace(/\s+/g, ' ').trim();
    const classSnippet = selectedEl.className ? ` (class: "${selectedEl.className}")` : '';
    
    // Temukan perkiraan komponen atau container
    const parentView = selectedEl.closest('[data-view], main, aside, header, footer, form');
    const locationHint = parentView ? `di dalam area <${parentView.tagName.toLowerCase()}>` : '';

    const promptText = `Tolong ubah elemen UI berikut:\n- Elemen: <${tagName}>${locationHint}\n- Teks saat ini: "${textSnippet}"\n${classSnippet ? `- Class: ${classSnippet}\n` : ''}- Instruksi perubahan: ${instruction.trim() || 'Sesuaikan tampilan elemen ini'}`;

    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div ref={containerRef} className="dev-visual-inspector font-sans select-none">
      {/* Box Highlight saat hover */}
      {isActive && boxRect && !selectedEl && (
        <div
          className="fixed pointer-events-none z-[999998] border-2 border-blue-500 bg-blue-500/10 rounded transition-all duration-75"
          style={{
            top: `${boxRect.top}px`,
            left: `${boxRect.left}px`,
            width: `${boxRect.width}px`,
            height: `${boxRect.height}px`,
          }}
        >
          <span className="absolute -top-6 left-0 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
            &lt;{hoveredEl?.tagName.toLowerCase()}&gt; {hoveredEl?.innerText?.slice(0, 20)}
          </span>
        </div>
      )}

      {/* Floating Toggle Button di Kiri Bawah */}
      <div className="fixed bottom-4 left-4 z-[999999] flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setIsActive(!isActive);
            if (isActive) setSelectedEl(null);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-xs font-semibold transition-all cursor-pointer ${
            isActive
              ? 'bg-blue-600 text-white ring-4 ring-blue-300'
              : 'bg-white/95 text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
          title="Klik atau tekan Alt + I untuk aktifkan/matikan"
        >
          <MousePointerClick className="w-4 h-4" />
          <span>{isActive ? '🎯 Inspektur Aktif (Klik Elemen)' : '🎯 Inspektur UI'}</span>
        </button>

        {isActive && (
          <span className="hidden sm:inline-block bg-black/75 text-white text-[11px] px-2.5 py-1 rounded-full backdrop-blur-xs">
            Klik elemen mana saja di layar
          </span>
        )}
      </div>

      {/* Modal Dialog Tindakan ketika elemen diklik */}
      {selectedEl && (
        <div className="fixed inset-0 z-[999999] bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-100 animate-in fade-in zoom-in-95">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Inspektur Elemen UI</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEl(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info Elemen yang Dipilih */}
            <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-200/60">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Elemen:</span>
                <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-blue-600 font-mono font-bold">
                  &lt;{selectedEl.tagName.toLowerCase()}&gt;
                </code>
              </div>
              {originalText && (
                <div>
                  <span className="font-semibold text-slate-500">Isi Teks:</span>
                  <p className="text-slate-800 font-medium italic mt-0.5 max-h-16 overflow-y-auto bg-white p-2 rounded border border-slate-200">
                    "{originalText}"
                  </p>
                </div>
              )}
            </div>

            {/* Opsi 1: Edit Mandiri Langsung di Layar (WYSIWYG Tweak) */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Opsi 1: Coba Edit Mandiri (Preview di Layar)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleMakeEditable();
                    setSelectedEl(null);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-medium transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Ketik Teks Langsung</span>
                </button>
                <button
                  type="button"
                  onClick={handleHideElement}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-xs font-medium transition cursor-pointer"
                >
                  <EyeOff className="w-3.5 h-3.5 text-rose-700" />
                  <span>Sembunyikan Elemen</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                *Hanya preview sementara di browser. Untuk permanen, gunakan opsi AI di bawah.
              </p>
            </div>

            {/* Opsi 2: Suruh AI (AI Prompt Generator) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Opsi 2: Suruh AI Ubah Permanen di Kode
              </span>
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Misal: ganti warna jadi merah, hapus teks ini, perbesar ukuran..."
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-800 placeholder:text-slate-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCopyPrompt();
                }}
              />
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition active:scale-[0.99] cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin ke Clipboard! Tinggal Paste di Chat AI' : 'Salin Perintah untuk AI'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
