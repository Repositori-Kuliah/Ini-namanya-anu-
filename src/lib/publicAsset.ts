/**
 * Resolve a file served from /public against Vite or Next.js base path.
 *
 * Assets referenced as "/logo-rawon.png" break when the app is hosted under a
 * subpath (e.g. GitHub Pages /Ini-namanya-anu-/). Always use this helper for
 * public files referenced from JS/TS.
 */
export const publicAsset = (path: string): string => {
  const base = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.BASE_URL)
    ? (import.meta as any).env.BASE_URL
    : '/';
  const cleanPath = path.replace(/^\/+/, '');
  return `${base.endsWith('/') ? base : base + '/'}${cleanPath}`;
};
