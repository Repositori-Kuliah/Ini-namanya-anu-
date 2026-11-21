import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string, fallback: string = ''): string => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[`NEXT_PUBLIC_${key}`]) return process.env[`NEXT_PUBLIC_${key}`] as string;
    if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`] as string;
    if (process.env[key]) return process.env[key] as string;
  }
  try {
    const meta = import.meta as any;
    if (meta?.env) {
      if (meta.env[`NEXT_PUBLIC_${key}`]) return meta.env[`NEXT_PUBLIC_${key}`];
      if (meta.env[`VITE_${key}`]) return meta.env[`VITE_${key}`];
      if (meta.env[key]) return meta.env[key];
    }
  } catch {
    // Abaikan jika import.meta tidak tersedia dalam runtime tertentu
  }
  return fallback;
};

const url =
  getEnv('SUPABASE_URL') ||
  'https://oktednhbuotgzmcvcner.supabase.co';

const key =
  getEnv('SUPABASE_ANON_KEY') ||
  getEnv('SUPABASE_PUBLISHABLE_KEY') ||
  'sb_publishable_LuXOP_YJDUDbsWcVIMhrTA_nG3Hw5gg';

export const isRealSupabaseConfigured = Boolean(url && key);
export const isDemoMode = false;
export const supabaseConfigured = isRealSupabaseConfigured;

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const enableDemoMode = () => {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

export const resetToRealSupabase = () => {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

/** Alamat dasar untuk URL QR meja (resilien terhadap SSR dan client-side rendering). */
export const appBaseUrl = () => {
  const configured = getEnv('APP_URL');
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

export const tableUrl = (qrToken: string) => `${appBaseUrl()}/pesan?meja=${encodeURIComponent(qrToken)}`;
