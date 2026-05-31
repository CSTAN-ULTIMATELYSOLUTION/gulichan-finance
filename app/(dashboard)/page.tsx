'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { CategoryDonut } from '@/components/dashboard/category-donut';
import { CashflowChart } from '@/components/dashboard/cashflow-chart';
import { DebtProgress } from '@/components/dashboard/debt-progress';
import { MetricCard } from '@/components/dashboard/metric-card';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/state';
import { PREVIEW_DASHBOARD } from '@/lib/preview-data';
import { DashboardPayload } from '@/lib/types';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState('');
  const [insights, setInsights] = useState('');
  const [insightError, setInsightError] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('preview') === '1') {
      setData(PREVIEW_DASHBOARD);
      return;
    }
    fetch('/api/dashboard')
      .then(async (res) => {
        const body = (await res.json()) as DashboardPayload | { error: string };
        if (!res.ok) throw new Error('error' in body ? body.error : 'Dashboard request failed.');
        setData(body as DashboardPayload);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function getInsights() {
    setLoadingInsights(true);
    setInsightError('');
    try {
      const res = await fetch('/api/insights');
      const body = (await res.json()) as { insights?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Insight request failed.');
      setInsights(body.insights ?? '');
    } catch (err) {
      setInsightError(err instanceof Error ? err.message : 'Insight request failed.');
    } finally {
      setLoadingInsights(false);
    }
  }

  if (error) return <ErrorBlock message={error} />;
  if (!data) return <LoadingBlock label="Loading dashboard" />;

  const current = data.current_month;
  const personalDebts = data.active_debts.filter((debt) => debt.type === 'personal');
  const businessDebts = data.active_debts.filter((debt) => debt.type === 'business');
  const salary = current?.salary_income ?? 0;
  const spent = current?.personal_costs ?? 0;
  const net = salary - spent;
  const personalDebtTotal = personalDebts.reduce((sum, debt) => sum + debt.remaining_amount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-on-dark">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Cashflow, burn rate, and debt pressure in one screen.</p>
      </div>

      {!current && data.last_6_months.length === 0 ? (
        <EmptyBlock title="No finance data yet" body="Upload a statement after Supabase is configured." />
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Salary this month" value={salary} sub="Real take-home" tone="up" />
        <MetricCard label="Total spent" value={spent} sub="Personal only" tone="down" />
        <MetricCard label="Net position" value={net} sub="Available for debt" tone={net >= 0 ? 'up' : 'down'} />
        <MetricCard label="Total debt" value={personalDebtTotal} sub="Personal debts only" tone="primary" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <CashflowChart data={data.last_6_months} />
        <CategoryDonut data={data.category_breakdown} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <DebtProgress title="Personal Debts" debts={personalDebts} />
        <DebtProgress title="AGA Business Debts (not your money)" debts={businessDebts} muted />
      </section>

      <section className="rounded-card border border-hairline bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-on-dark">AI Insights</h2>
            <p className="mt-1 text-sm text-muted">Three blunt actions based on the current numbers.</p>
          </div>
          <button
            onClick={getInsights}
            disabled={loadingInsights}
            className="inline-flex h-10 items-center gap-2 rounded-btn bg-primary px-4 text-sm font-semibold text-on-primary transition hover:bg-primary-active disabled:opacity-60"
          >
            Get AI Analysis <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {loadingInsights ? (
          <div className="mt-6 space-y-3">
            <div className="h-4 w-11/12 animate-pulse rounded bg-elevated" />
            <div className="h-4 w-9/12 animate-pulse rounded bg-elevated" />
            <div className="h-4 w-10/12 animate-pulse rounded bg-elevated" />
          </div>
        ) : null}
        {insightError ? <p className="mt-5 text-sm text-down">{insightError}</p> : null}
        {insights ? <div className="mt-5 whitespace-pre-line text-sm leading-6 text-body">{insights}</div> : null}
      </section>
    </div>
  );
}
