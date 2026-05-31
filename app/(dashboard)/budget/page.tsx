'use client';

import { Check, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/state';
import { currentMonthKey, formatAmount } from '@/lib/format';
import { PREVIEW_DASHBOARD } from '@/lib/preview-data';
import { Budget, CATEGORY_LABELS, CategorySummary, DashboardPayload, TransactionCategory } from '@/lib/types';

interface BudgetRow {
  category: TransactionCategory;
  budgeted: number;
  actual: number;
  id: string;
}

export default function BudgetPage() {
  const [month, setMonth] = useState(currentMonthKey());
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setLoading(true);
    if (new URLSearchParams(window.location.search).get('preview') === '1') {
      const budgetMap = new Map<TransactionCategory, Budget>();
      const categoryMap = new Map<TransactionCategory, CategorySummary>();
      PREVIEW_DASHBOARD.budgets.filter((budget) => budget.month === month).forEach((budget) => budgetMap.set(budget.category, budget));
      PREVIEW_DASHBOARD.category_breakdown.filter((cat) => cat.month === month).forEach((cat) => categoryMap.set(cat.category, cat));
      const categories = new Set<TransactionCategory>([...Array.from(budgetMap.keys()), ...Array.from(categoryMap.keys())]);
      setRows(
        Array.from(categories).map((category) => ({
          category,
          budgeted: budgetMap.get(category)?.budgeted_amount ?? 0,
          actual: categoryMap.get(category)?.total_spent ?? 0,
          id: budgetMap.get(category)?.id ?? category
        }))
      );
      setError('');
      setLoading(false);
      return;
    }
    fetch('/api/dashboard')
      .then(async (res) => {
        const body = (await res.json()) as DashboardPayload | { error: string };
        if (!res.ok) throw new Error('error' in body ? body.error : 'Budget request failed.');
        const payload = body as DashboardPayload;
        const budgetMap = new Map<TransactionCategory, Budget>();
        const categoryMap = new Map<TransactionCategory, CategorySummary>();
        payload.budgets.filter((budget) => budget.month === month).forEach((budget) => budgetMap.set(budget.category, budget));
        payload.category_breakdown.filter((cat) => cat.month === month).forEach((cat) => categoryMap.set(cat.category, cat));
        const categories = new Set<TransactionCategory>([...Array.from(budgetMap.keys()), ...Array.from(categoryMap.keys())]);
        setRows(
          Array.from(categories).map((category) => ({
            category,
            budgeted: budgetMap.get(category)?.budgeted_amount ?? 0,
            actual: categoryMap.get(category)?.total_spent ?? 0,
            id: budgetMap.get(category)?.id ?? category
          }))
        );
        setError('');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [month]);

  const totals = rows.reduce(
    (acc, row) => ({ budgeted: acc.budgeted + row.budgeted, actual: acc.actual + row.actual }),
    { budgeted: 0, actual: 0 }
  );

  async function saveBudget(row: BudgetRow) {
    const nextValue = Number(draft);
    if (Number.isNaN(nextValue) || row.id === row.category) {
      setEditing(null);
      return;
    }
    const res = await fetch(`/api/budgets/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budgeted_amount: nextValue })
    });
    const body = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(body.error ?? 'Budget update failed.');
      return;
    }
    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, budgeted: nextValue } : item)));
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Budget</h1>
          <p className="mt-1 text-sm text-muted">Budgeted versus actual spending by category.</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className="h-10 rounded-input border border-hairline bg-elevated px-3 text-sm text-body outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {error ? <ErrorBlock message={error} /> : null}
      {loading ? <LoadingBlock label="Loading budget" /> : null}
      {!loading && !error && rows.length === 0 ? <EmptyBlock title="No budget rows" body="Budgets and spending for the selected month will appear here." /> : null}

      {!loading && rows.length > 0 ? (
        <div className="overflow-x-auto rounded-card border border-hairline bg-card scrollbar-thin">
          <table className="min-w-[860px] w-full border-collapse">
            <thead>
              <tr className="border-b border-hairline text-left text-xs font-medium text-muted">
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Budgeted</th>
                <th className="px-4 py-3 text-right">Actual Spent</th>
                <th className="px-4 py-3 text-right">Difference</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const diff = row.budgeted - row.actual;
                const paused = row.budgeted === 0;
                return (
                  <tr key={row.id} className="border-b border-hairline last:border-b-0">
                    <td className="px-4 py-3 text-sm font-semibold text-on-dark">{CATEGORY_LABELS[row.category]}</td>
                    <td className="px-4 py-3 text-right font-num text-sm text-body">
                      {editing === row.id && row.id !== row.category ? (
                        <input
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          onBlur={() => void saveBudget(row)}
                          type="number"
                          min="0"
                          step="0.01"
                          className="h-8 w-32 rounded-input border border-hairline bg-elevated px-2 text-right font-num text-sm text-body outline-none focus:ring-2 focus:ring-primary/30"
                          autoFocus
                        />
                      ) : (
                        <>RM {formatAmount(row.budgeted)}</>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-num text-sm text-body">RM {formatAmount(row.actual)}</td>
                    <td className={`px-4 py-3 text-right font-num text-sm font-medium ${diff >= 0 ? 'text-up' : 'text-down'}`}>RM {formatAmount(diff)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${paused ? 'bg-elevated text-muted' : diff >= 0 ? 'bg-up/10 text-up' : 'bg-down/10 text-down'}`}>
                        {paused ? 'Paused' : diff >= 0 ? 'Under' : 'Over'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          if (editing === row.id) {
                            void saveBudget(row);
                          } else {
                            setDraft(String(row.budgeted));
                            setEditing(row.id);
                          }
                        }}
                        className="rounded-btn p-1.5 text-muted hover:bg-elevated hover:text-body"
                        aria-label="Toggle edit"
                      >
                        {editing === row.id ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-elevated font-num text-base font-bold">
                <td className="px-4 py-4 text-sm font-semibold text-on-dark">Total</td>
                <td className="px-4 py-4 text-right text-body">RM {formatAmount(totals.budgeted)}</td>
                <td className="px-4 py-4 text-right text-body">RM {formatAmount(totals.actual)}</td>
                <td className={`px-4 py-4 text-right ${totals.budgeted - totals.actual >= 0 ? 'text-up' : 'text-down'}`}>RM {formatAmount(totals.budgeted - totals.actual)}</td>
                <td className="px-4 py-4" />
                <td className="px-4 py-4" />
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
