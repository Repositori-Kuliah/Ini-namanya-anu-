import { useState, useEffect } from 'react';

/**
 * Custom Hook untuk pola UI "Smart Header / Collapsible Headroom"
 * - Mengembalikan `true` jika pengguna scroll ke atas atau berada di puncak
 * - Mengembalikan `false` jika pengguna scroll ke bawah
 * - Toleransi asimetris yang disempurnakan:
 *   - Scroll ke bawah butuh gerakan mantap (30px) agar tidak mudah sembunyi karena senggolan jari.
 *   - Scroll ke atas sangat responsif (10px): usap sedikit saja ke atas di mana pun posisinya,
 *     search bar LANGSUNG muncul kembali seketika tanpa harus menunggu sampai mentok di puncak.
 * - Mendukung scroll window global maupun elemen kontainer independen (overflow-y-auto).
 */
export function useScrollDirection() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const scrollMap = new WeakMap<HTMLElement, number>();
    let ticking = false;

    const DOWN_THRESHOLD = 30; // Butuh scroll ke bawah 30px baru sembunyi
    const UP_THRESHOLD = 10;   // Usap jari ke atas 10px langsung turun seketika!

    const handleScroll = (e: Event) => {
      const target = e.target;
      let el: HTMLElement | null = null;
      let scrollY = 0;

      if (target === document || target === window) {
        el = document.documentElement;
        scrollY = window.pageYOffset || document.documentElement.scrollTop;
      } else if (target instanceof HTMLElement) {
        // Abaikan elemen kecil (seperti dropdown atau modal kecil)
        if (target.clientHeight < 220) return;
        el = target;
        scrollY = target.scrollTop;
      } else {
        return;
      }

      if (!el) return;

      const currentScrollY = scrollY;
      const currentEl = el;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Jika berada di puncak (<= 45px): selalu tampilkan
          if (currentScrollY <= 45) {
            setIsVisible(true);
            scrollMap.set(currentEl, Math.max(0, currentScrollY));
            ticking = false;
            return;
          }

          const lastY = scrollMap.get(currentEl) ?? currentScrollY;
          const diff = currentScrollY - lastY;

          if (diff > DOWN_THRESHOLD) {
            // Scroll ke bawah: sembunyikan bar
            setIsVisible(false);
            scrollMap.set(currentEl, currentScrollY);
          } else if (diff < -UP_THRESHOLD) {
            // Usap ke atas sedikit: LANGSUNG munculkan seketika!
            setIsVisible(true);
            scrollMap.set(currentEl, currentScrollY);
          }

          ticking = false;
        });

        ticking = true;
      }
    };

    // Gunakan capture: true agar mendeteksi scroll window maupun kontainer div list
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  return isVisible;
}
