import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseEnv } from '@/lib/api';
import { supabaseAdmin } from '@/lib/supabase';
import { Transaction } from '@/lib/types';

type UpdateTransactionBody = Partial<Pick<Transaction, 'category' | 'notes' | 'is_business' | 'is_reimbursable' | 'reimbursed'>>;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const envError = requireSupabaseEnv();
  if (envError) return envError;

  const body = (await req.json()) as UpdateTransactionBody;
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .update(body)
    .eq('id', params.id)
    .select()
    .single<Transaction>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
