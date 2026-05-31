import { NextResponse } from 'next/server';
import { requireSupabaseEnv } from '@/lib/api';
import { currentMonthKey } from '@/lib/format';
import { supabaseAdmin } from '@/lib/supabase';
import { Budget, CategorySummary, Debt, MonthlySummary } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envError = requireSupabaseEnv();
  if (envError) return envError;

  const month = currentMonthKey();
  const [cur, hist, cats, debts, budgets] = await Promise.all([
    supabaseAdmin.from('monthly_summary').select('*').eq('month', month).maybeSingle<MonthlySummary>(),
    supabaseAdmin.from('monthly_summary').select('*').order('month', { ascending: false }).limit(6).returns<MonthlySummary[]>(),
    supabaseAdmin.from('category_summary').select('*').eq('month', month).returns<CategorySummary[]>(),
    supabaseAdmin.from('debts').select('*').eq('status', 'active').order('priority').returns<Debt[]>(),
    supabaseAdmin.from('budgets').select('*').eq('month', month).returns<Budget[]>()
  ]);

  const error = cur.error ?? hist.error ?? cats.error ?? debts.error ?? budgets.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    current_month: cur.data,
    last_6_months: hist.data ?? [],
    category_breakdown: cats.data ?? [],
    active_debts: debts.data ?? [],
    budgets: budgets.data ?? []
  });
}
