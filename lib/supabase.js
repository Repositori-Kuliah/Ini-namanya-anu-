/**
 * Supabase Client Factory for Next.js FP Backend (JavaScript).
 * Pure factory function without class instantiations.
 * Security & Reliability: Validates environment variables gracefully.
 */

import { createClient } from '@supabase/supabase-js';

const getEnv = (key, fallback = '') =>
  process.env[key] || process.env[`NEXT_PUBLIC_${key}`] || process.env[`VITE_${key}`] || fallback;

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[SupabaseBackend] Warning: SUPABASE_URL or SUPABASE_ANON_KEY is not set. Using local fallback.');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://mock-project.supabase.co',
  supabaseAnonKey || 'mock-anon-key',
  {
    auth: { persistSession: false },
  }
);
