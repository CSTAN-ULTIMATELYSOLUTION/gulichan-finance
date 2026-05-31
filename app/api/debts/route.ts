import { NextResponse } from 'next/server';
import { requireSupabaseEnv } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Debt } from '@/lib/types';

export async function GET() {
  const envError = requireSupabaseEnv();
  if (envError) return envError;

  const { data, error } = await supabase.from('debts').select('*').eq('status', 'active').order('priority').returns<Debt[]>();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    personal: data?.filter((debt) => debt.type === 'personal') ?? [],
    business: data?.filter((debt) => debt.type === 'business') ?? []
  });
}
