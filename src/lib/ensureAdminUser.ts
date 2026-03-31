import { supabase } from './supabase';
import type { FixMyRideUser } from '../types/index';

/**
 * Supabase Auth (auth.users) is separate from your app table (admin_users).
 * This ensures an authenticated user has a corresponding `admin_users` row.
 */
export async function ensureAdminUser(user: FixMyRideUser) {
  if (!user?.id) return;

  const { data: existing, error: selErr } = await (supabase as any)
    .from('admin_users')
    .select('id,is_active,email')
    .eq('id', user.id)
    .maybeSingle();

  if (selErr) {
    // If RLS blocks this, you'll need a DB trigger or Edge Function.
    console.warn('admin_users select failed:', selErr.message || selErr);
    return;
  }

  if (existing) {
    if (existing.is_active === false) {
      await supabase.auth.signOut();
    }
    return;
  }

  const payload = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name ?? null,
    role: 'Admin',
    is_active: true,
  };

  const { error: insErr } = await (supabase as any).from('admin_users').insert([payload]);
  if (insErr) {
    console.warn('admin_users insert failed:', insErr.message || insErr);
  }
}

