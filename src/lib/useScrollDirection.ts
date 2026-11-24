import { useState, useEffect } from 'react';

/**
 * Custom Hook untuk pola UI "Smart Header / Collapsible Headroom"
 * - Mengembalikan `true` jika pengguna scroll ke atas atau berada di puncak
 * - Mengembalikan `false` jika pengguna scroll ke bawah
 */
export function useScrollDirection() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    let ticking = false;

    const DOWN_THRESHOLD = 25; // Scroll ke bawah sejauh 25px -> sembunyikan bar
    const UP_THRESHOLD = 8;    // Usap jari ke atas 8px saja -> LANGSUNG MUNCULKAN!

    const updateScroll = (currentY: number) => {
      // Jika di puncak halaman (<= 60px): selalu tampilkan
      if (currentY <= 60) {
        setIsVisible(true);
        lastScrollY = Math.max(0, currentY);
        return;
      }

      const diff = currentY - lastScrollY;

      if (diff > DOWN_THRESHOLD) {
        // Scroll ke bawah: sembunyikan bar
        setIsVisible(false);
        lastScrollY = currentY;
      } else if (diff < -UP_THRESHOLD) {
        // Usap jari ke atas sedikit: LANGSUNG MUNCULKAN!
        setIsVisible(true);
        lastScrollY = currentY;
      }
    };

    const handleScroll = (e: Event) => {
      let scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const target = e.target;
      if (target instanceof HTMLElement && target !== document.documentElement) {
        if (target.clientHeight >= 200 && target.scrollTop > 0) {
          scrollY = target.scrollTop;
        }
      }

      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScroll(scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  return isVisible;
}
