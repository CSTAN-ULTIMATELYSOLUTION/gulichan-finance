import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseEnv } from '@/lib/api';
import { supabaseAdmin } from '@/lib/supabase';
import { Budget } from '@/lib/types';

interface BudgetUpdateBody {
  budgeted_amount: number;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const envError = requireSupabaseEnv();
  if (envError) return envError;

  const body = (await req.json()) as BudgetUpdateBody;
  if (Number.isNaN(body.budgeted_amount) || body.budgeted_amount < 0) {
    return NextResponse.json({ error: 'Budget amount must be zero or higher.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('budgets')
    .update({ budgeted_amount: body.budgeted_amount })
    .eq('id', params.id)
    .select()
    .single<Budget>();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
