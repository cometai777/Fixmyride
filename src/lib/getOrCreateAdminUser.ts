import { supabase } from './supabase';

/** If admin_users.company_id is required, set VITE_DEFAULT_COMPANY_ID in .env */
function defaultCompanyId(): string | undefined {
  const v = (import.meta.env.VITE_DEFAULT_COMPANY_ID as string | undefined)?.trim();
  return v || undefined;
}

export type AdminUserRow = {
  id?: string;
  email?: string;
  full_name?: string | null;
  role?: 'user' | 'admin' | 'super admin' | string;
  is_active?: boolean;
  [k: string]: any;
};

/**
 * Ensures there's an `admin_users` row for this email.
 * - If missing: creates it with role = 'user' (pending approval).
 *
 * Requires RLS to allow:
 * - SELECT by email for authenticated users
 * - INSERT for authenticated users (or you must use a DB trigger / Edge Function)
 */
export async function getOrCreateAdminUserByEmail(params: {
  email: string | null | undefined;
  authUserId?: string;
  fullName?: string | null;
}): Promise<{ ok: true; admin: AdminUserRow } | { ok: false; reason: string }> {
  const normalized = (params.email || '').trim().toLowerCase();
  if (!normalized) return { ok: false, reason: 'Missing email on auth user.' };

  const { data: existing, error: selErr } = await (supabase as any)
    .from('admin_users')
    .select('*')
    .eq('email', normalized)
    .maybeSingle();

  if (selErr) return { ok: false, reason: selErr.message || 'admin_users lookup failed.' };
  if (existing) return { ok: true, admin: existing };

  const companyId = defaultCompanyId();
  const payload: AdminUserRow = {
    id: params.authUserId,
    email: normalized,
    full_name: params.fullName ?? null,
    role: 'user',
    is_active: true,
    ...(companyId ? { company_id: companyId } : {}),
  };

  const { data: created, error: insErr } = await (supabase as any)
    .from('admin_users')
    .insert([payload])
    .select('*')
    .maybeSingle();

  if (insErr) {
    console.error('admin_users insert failed:', insErr);
    return {
      ok: false,
      reason:
        insErr.message ||
        'Could not create admin_users row. Check RLS policies, required columns (e.g. company_id), and apply the Supabase migration in supabase/migrations/.',
    };
  }
  return { ok: true, admin: created || payload };
}

