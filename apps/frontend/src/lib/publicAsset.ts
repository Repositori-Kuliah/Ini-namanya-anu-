/**
 * Resolve a file served from /public against Vite's base path.
 *
 * Assets referenced as "/logo-rawon.png" break when the app is hosted under a
 * subpath (e.g. GitHub Pages /Ini-namanya-anu-/). Always use this helper for
 * public files referenced from JS/TS.
 */
export const publicAsset = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
