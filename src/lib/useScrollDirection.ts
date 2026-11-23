import { useState, useEffect } from 'react';

/**
 * Custom Hook untuk pola UI "Smart Header / Collapsible Headroom"
 * - Mengembalikan `true` jika pengguna scroll ke atas (atau berada di puncak halaman)
 * - Mengembalikan `false` jika pengguna scroll ke bawah sejauh threshold
 */
export function useScrollDirection(threshold: number = 15) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      // Di puncak halaman (<= 60px): selalu tampilkan
      if (scrollY <= 60) {
        setIsVisible(true);
        lastScrollY = scrollY <= 0 ? 0 : scrollY;
        ticking = false;
        return;
      }

      const diff = scrollY - lastScrollY;
      if (Math.abs(diff) >= threshold) {
        if (diff > 0) {
          // Scroll ke bawah: sembunyikan bar
          setIsVisible(false);
        } else {
          // Scroll ke atas: munculkan kembali bar
          setIsVisible(true);
        }
        lastScrollY = scrollY;
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return isVisible;
}
