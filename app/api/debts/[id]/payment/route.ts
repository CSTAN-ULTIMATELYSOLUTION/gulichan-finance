import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseEnv } from '@/lib/api';
import { supabaseAdmin } from '@/lib/supabase';
import { Debt } from '@/lib/types';

interface PaymentBody {
  amount: number;
  date: string;
  notes?: string;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const envError = requireSupabaseEnv();
  if (envError) return envError;

  const { amount, date, notes } = (await req.json()) as PaymentBody;
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Payment amount must be positive.' }, { status: 400 });

  const { data: debt, error: debtError } = await supabaseAdmin.from('debts').select('*').eq('id', params.id).single<Debt>();
  if (debtError || !debt) return NextResponse.json({ error: 'Debt not found.' }, { status: 404 });

  const newPaid = Number(debt.paid_amount) + amount;
  const cleared = newPaid >= Number(debt.original_amount);
  const { error: updateError } = await supabaseAdmin
    .from('debts')
    .update({
      paid_amount: newPaid,
      status: cleared ? 'cleared' : 'active',
      cleared_at: cleared ? new Date().toISOString() : null
    })
    .eq('id', params.id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { data: account } = await supabaseAdmin.from('accounts').select('id').eq('name', 'Maybank Personal').single<{ id: string }>();
  if (account) {
    await supabaseAdmin.from('transactions').insert({
      account_id: account.id,
      date,
      description: `Debt payment - ${debt.creditor}`,
      amount,
      direction: 'out',
      category: 'debt_payment',
      notes
    });
  }

  return NextResponse.json({ success: true, cleared });
}
