/**
 * Supabase project credentials (Dashboard → Project Settings → API).
 * The anon key is a public client key — safe to ship in the app;
 * row-level security on the server is what protects the data.
 */
export const SUPABASE_URL = 'https://geqwwepdtiwzufhndqcg.supabase.co';
export const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlcXd3ZXBkdGl3enVmaG5kcWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MzI3MDcsImV4cCI6MjEwMDAwODcwN30.zkN1--EobTMJExv9xETp99Ey3tgYHYUFoJqcrs_jlHE';

export const isConfigured =
  !SUPABASE_URL.includes('YOUR_PROJECT') && !SUPABASE_KEY.includes('YOUR_');
