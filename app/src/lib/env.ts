/**
 * Supabase project credentials.
 * Fill these from Supabase Dashboard → Project Settings → API.
 * While these are placeholders the app runs on bundled sample questions.
 */
export const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
export const SUPABASE_KEY = 'YOUR_ANON_OR_PUBLISHABLE_KEY';

export const isConfigured =
  !SUPABASE_URL.includes('YOUR_PROJECT') && !SUPABASE_KEY.includes('YOUR_');
