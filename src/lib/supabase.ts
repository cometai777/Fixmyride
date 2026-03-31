import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Singleton pattern for the Supabase client to prevent "Multiple GoTrueClient instances" warning
let supabaseInstance: ReturnType<typeof createClient> | null = null;

if (!supabaseInstance) {
  const isValid = supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 50;
  if (!isValid) {
    console.info("Supabase credentials not configured or invalid. Initializing empty client for offline mode.");
  }
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

export const supabase = supabaseInstance;
