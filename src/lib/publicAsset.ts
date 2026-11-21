const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ||
  (process.env.NODE_ENV === 'production' ? '/Ini-namanya-anu-' : '');

/**
 * Resolve a file served from /public against the configured application base
 * path. This keeps public assets working on GitHub Pages project sites.
 */
export const publicAsset = (path: string): string => {
  const cleanPath = path.replace(/^\/+/, '');
  return `${basePath.replace(/\/$/, '')}/${cleanPath}`;
};
