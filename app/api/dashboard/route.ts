import { NextResponse } from 'next/server';
import { requireSupabaseEnv } from '@/lib/api';
import { currentMonthKey } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { Budget, CategorySummary, Debt, MonthlySummary } from '@/lib/types';

export async function GET() {
  const envError = requireSupabaseEnv();
  if (envError) return envError;

  const month = currentMonthKey();
  const [cur, hist, cats, debts, budgets] = await Promise.all([
    supabase.from('monthly_summary').select('*').eq('month', month).maybeSingle<MonthlySummary>(),
    supabase.from('monthly_summary').select('*').order('month', { ascending: false }).limit(6).returns<MonthlySummary[]>(),
    supabase.from('category_summary').select('*').eq('month', month).returns<CategorySummary[]>(),
    supabase.from('debts').select('*').eq('status', 'active').order('priority').returns<Debt[]>(),
    supabase.from('budgets').select('*').eq('month', month).returns<Budget[]>()
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
