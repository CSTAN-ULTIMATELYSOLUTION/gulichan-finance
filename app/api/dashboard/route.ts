import { NextResponse } from 'next/server';
import { requireSupabaseEnv } from '@/lib/api';
import { currentMonthKey } from '@/lib/format';
import { supabaseAdmin } from '@/lib/supabase';
import { Budget, CategorySummary, Debt, MonthlySummary, Transaction, TransactionCategory } from '@/lib/types';

export const dynamic = 'force-dynamic';

function emptyMonthlySummary(month: string): MonthlySummary {
  return {
    month,
    salary_income: 0,
    reimbursements_in: 0,
    total_in: 0,
    total_out: 0,
    business_costs: 0,
    personal_costs: 0,
    debt_payments: 0,
    transaction_count: 0
  };
}

function buildMonthlySummaries(transactions: Transaction[]) {
  const byMonth = new Map<string, MonthlySummary>();

  for (const tx of transactions) {
    const summary = byMonth.get(tx.month) ?? emptyMonthlySummary(tx.month);
    if (tx.direction === 'in') {
      summary.total_in += tx.amount;
      if (tx.category === 'salary') summary.salary_income += tx.amount;
      if (tx.category === 'reimbursement') summary.reimbursements_in += tx.amount;
    } else {
      summary.total_out += tx.amount;
      if (tx.is_business) summary.business_costs += tx.amount;
      else summary.personal_costs += tx.amount;
      if (tx.category === 'debt_payment') summary.debt_payments += tx.amount;
    }
    summary.transaction_count += 1;
    byMonth.set(tx.month, summary);
  }

  return Array.from(byMonth.values()).sort((a, b) => b.month.localeCompare(a.month));
}

function buildCategorySummary(transactions: Transaction[], month: string) {
  const byCategory = new Map<TransactionCategory, CategorySummary>();

  for (const tx of transactions) {
    if (tx.month !== month) continue;
    const summary = byCategory.get(tx.category) ?? {
      month,
      category: tx.category,
      total_spent: 0,
      transaction_count: 0
    };
    if (tx.direction === 'out') summary.total_spent += tx.amount;
    summary.transaction_count += 1;
    byCategory.set(tx.category, summary);
  }

  return Array.from(byCategory.values()).sort((a, b) => b.total_spent - a.total_spent);
}

export async function GET() {
  const envError = requireSupabaseEnv();
  if (envError) return envError;

  const month = currentMonthKey();
  const [transactions, debts, budgets] = await Promise.all([
    supabaseAdmin
      .from('transactions')
      .select('id, account_id, date, description, amount, direction, category, is_business, is_reimbursable, reimbursed, source_file, month, notes, created_at')
      .order('date', { ascending: false })
      .limit(5000)
      .returns<Transaction[]>(),
    supabaseAdmin.from('debts').select('*').eq('status', 'active').order('priority').returns<Debt[]>(),
    supabaseAdmin.from('budgets').select('*').returns<Budget[]>()
  ]);

  const error = transactions.error ?? debts.error ?? budgets.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = transactions.data ?? [];
  const monthly = buildMonthlySummaries(rows);
  const current = monthly.find((item) => item.month === month) ?? monthly[0] ?? null;
  const dashboardMonth = current?.month ?? month;

  return NextResponse.json({
    current_month: current,
    last_6_months: monthly.slice(0, 6),
    category_breakdown: buildCategorySummary(rows, dashboardMonth),
    active_debts: debts.data ?? [],
    budgets: (budgets.data ?? []).filter((budget) => budget.month === dashboardMonth)
  });
}
