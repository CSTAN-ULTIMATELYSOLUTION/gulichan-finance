import { NextResponse } from 'next/server';
import { requireSupabaseEnv } from '@/lib/api';
import { currentMonthKey } from '@/lib/format';
import { supabaseAdmin } from '@/lib/supabase';
import { CategorySummary, Debt, MonthlySummary } from '@/lib/types';

export const dynamic = 'force-dynamic';

function money(amount: number) {
  return `RM ${amount.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function buildInsights(monthly: MonthlySummary[], categories: CategorySummary[], debts: Debt[]) {
  const current = monthly[0];
  if (!current) return ['No monthly transaction data yet. Upload statements first, then rerun analysis.'];

  const personalDebts = debts.filter((debt) => debt.type === 'personal');
  const personalDebtTotal = personalDebts.reduce((sum, debt) => sum + Number(debt.remaining_amount), 0);
  const net = Number(current.salary_income) - Number(current.personal_costs);
  const topCategory = [...categories].sort((a, b) => Number(b.total_spent) - Number(a.total_spent))[0];
  const debtTarget = personalDebts.sort((a, b) => a.priority - b.priority || Number(b.remaining_amount) - Number(a.remaining_amount))[0];

  const insights: string[] = [];

  if (net > 0) {
    insights.push(`1. You have ${money(net)} left after personal costs this month. Send at least ${money(Math.min(net, personalDebtTotal))} to personal debt before it leaks into spending.`);
  } else {
    insights.push(`1. You are ${money(Math.abs(net))} negative after personal costs this month. Freeze non-fixed spending until salary resets.`);
  }

  if (topCategory) {
    insights.push(`2. Your biggest spend category is ${topCategory.category.replaceAll('_', ' ')} at ${money(Number(topCategory.total_spent))}. Cut this first; it is the fastest lever.`);
  } else {
    insights.push('2. No category spending exists for this month yet. Import statements before changing the budget.');
  }

  if (debtTarget) {
    insights.push(`3. Attack ${debtTarget.creditor} next: ${money(Number(debtTarget.remaining_amount))} remaining. Keep AGA/business debts separate from salary cashflow.`);
  } else {
    insights.push('3. No active personal debt found. Keep the debt page clean and redirect surplus to savings.');
  }

  return insights;
}

export async function GET() {
  const envError = requireSupabaseEnv();
  if (envError) return envError;

  const month = currentMonthKey();
  const [hist, cats, debts] = await Promise.all([
    supabaseAdmin.from('monthly_summary').select('*').order('month', { ascending: false }).limit(3).returns<MonthlySummary[]>(),
    supabaseAdmin.from('category_summary').select('*').eq('month', month).returns<CategorySummary[]>(),
    supabaseAdmin.from('debts').select('*').eq('status', 'active').returns<Debt[]>()
  ]);

  const error = hist.error ?? cats.error ?? debts.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ insights: buildInsights(hist.data ?? [], cats.data ?? [], debts.data ?? []).join('\n') });
}
