import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseEnv } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Transaction } from '@/lib/types';

export async function GET(req: NextRequest) {
  const envError = requireSupabaseEnv();
  if (envError) return envError;

  const params = new URL(req.url).searchParams;
  const page = Number(params.get('page') || '1');
  const limit = Number(params.get('limit') || '50');
  let query = supabase
    .from('transactions')
    .select('*, account:accounts(name,institution)', { count: 'exact' })
    .order('date', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (params.get('month')) query = query.eq('month', params.get('month')!);
  if (params.get('category')) query = query.eq('category', params.get('category')!);
  if (params.get('direction')) query = query.eq('direction', params.get('direction')!);
  if (params.get('search')) query = query.ilike('description', `%${params.get('search')}%`);

  const { data, count, error } = await query.returns<Transaction[]>();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [], count: count ?? 0 });
}
