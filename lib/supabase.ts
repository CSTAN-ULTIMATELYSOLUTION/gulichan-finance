import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function hasSupabaseEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export const supabase = createClient(
  supabaseUrl ?? 'https://example.supabase.co',
  supabaseAnonKey ?? 'missing-anon-key',
  { db: { schema: 'personal_finance' } }
);

export const supabaseAdmin = createClient(
  supabaseUrl ?? 'https://example.supabase.co',
  serviceRoleKey ?? supabaseAnonKey ?? 'missing-service-role-key',
  { db: { schema: 'personal_finance' } }
);
