import { useEffect } from 'react';

/**
 * Hook to lock background scrolling on body and html when a modal or pop-up is active.
 * Prevents mobile background scroll chaining.
 */
export const useLockBodyScroll = (lock: boolean): void => {
  useEffect(() => {
    if (!lock) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [lock]);
};
