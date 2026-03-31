import { supabase } from './supabase';

export type AdminAccessResult =
  | { ok: true; admin: any }
  | { ok: false; reason: string };

/**
 * Enforce "auth comes from database": only allow sessions whose auth uid exists in `admin_users`.
 *
 * Note: this requires RLS to allow authenticated users to SELECT their own admin_users row
 * (preferred). If RLS blocks it, you'll need an Edge Function / RPC / trigger.
 */
export async function validateAdminAccessByAuthUserId(authUserId: string | null | undefined): Promise<AdminAccessResult> {
  const id = (authUserId || '').trim();
  if (!id) return { ok: false, reason: 'Missing auth user id.' };

  const { data, error } = await (supabase as any)
    .from('admin_users')
    .select('*')
    .eq('auth_user_id', id)
    .maybeSingle();

  if (error) {
    return { ok: false, reason: error.message || 'admin_users lookup failed.' };
  }
  if (!data) {
    return { ok: false, reason: 'This account is not registered.' };
  }
  if (data.is_active === false) {
    return { ok: false, reason: 'Your admin account is inactive.' };
  }
  return { ok: true, admin: data };
}

