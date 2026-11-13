import { createClient } from '@supabase/supabase-js';
import { MockSupabaseClient } from './mockSupabase';

const url =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ||
  'https://fmwmvxqdnpbznnjtnnrx.supabase.co';

const key =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  'sb_publishable_uP60Of5g4Xw6MRsU3ni-Lg_3WKwdoOO';

export const isRealSupabaseConfigured = Boolean(url && key);
export const isDemoMode = false;
export const supabaseConfigured = isRealSupabaseConfigured;

export const supabase = createClient(url!, key!, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const enableDemoMode = () => {
  window.location.reload();
};

export const resetToRealSupabase = () => {
  window.location.reload();
};

/** Alamat dasar untuk URL QR meja. */
export const appBaseUrl = () => ((import.meta.env.VITE_APP_URL as string) || window.location.origin).replace(/\/$/, '');
export const tableUrl = (qrToken: string) => `${appBaseUrl()}/pesan?meja=${encodeURIComponent(qrToken)}`;
