'use client';

import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EditDialog } from '@/components/transactions/edit-dialog';
import { TransactionTable } from '@/components/transactions/transaction-table';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/state';
import { PREVIEW_TRANSACTIONS } from '@/lib/preview-data';
import { CATEGORIES, CATEGORY_LABELS, Transaction, TransactionCategory, TransactionDirection } from '@/lib/types';

interface TransactionResponse {
  data: Transaction[];
  count: number;
  error?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState('');
  const [category, setCategory] = useState('');
  const [direction, setDirection] = useState<'all' | TransactionDirection>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (month) params.set('month', month);
    if (category) params.set('category', category);
    if (direction !== 'all') params.set('direction', direction);
    if (search) params.set('search', search);
    return params.toString();
  }, [page, month, category, direction, search]);

  function load() {
    setLoading(true);
    if (new URLSearchParams(window.location.search).get('preview') === '1') {
      setTransactions(PREVIEW_TRANSACTIONS);
      setCount(PREVIEW_TRANSACTIONS.length);
      setError('');
      setLoading(false);
      return;
    }
    fetch(`/api/transactions?${query}`)
      .then(async (res) => {
        const body = (await res.json()) as TransactionResponse;
        if (!res.ok) throw new Error(body.error ?? 'Transaction request failed.');
        setTransactions(body.data);
        setCount(body.count);
        setError('');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [query]);

  const totalPages = Math.max(1, Math.ceil(count / 50));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-on-dark">Transactions</h1>
        <p className="mt-1 text-sm text-muted">Filter, inspect, and recategorise imported statement lines.</p>
      </div>

      <section className="grid gap-3 rounded-card border border-hairline bg-card p-4 lg:grid-cols-[160px_220px_240px_1fr]">
        <input
          type="month"
          value={month}
          onChange={(event) => {
            setMonth(event.target.value);
            setPage(1);
          }}
          className="h-10 rounded-input border border-hairline bg-elevated px-3 text-sm text-body outline-none focus:ring-2 focus:ring-primary/30"
        />
        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
          className="h-10 rounded-input border border-hairline bg-elevated px-3 text-sm text-body outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {CATEGORY_LABELS[item]}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-3 rounded-full bg-elevated p-1 text-xs font-semibold">
          {(['all', 'in', 'out'] as const).map((item) => (
            <button
              key={item}
              onClick={() => {
                setDirection(item);
                setPage(1);
              }}
              className={direction === item ? 'rounded-full bg-primary py-2 text-on-primary' : 'rounded-full py-2 text-muted hover:text-body'}
            >
              {item === 'all' ? 'All' : item === 'in' ? 'In' : 'Out'}
            </button>
          ))}
        </div>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search description"
            className="h-10 w-full rounded-input border border-hairline bg-elevated pl-10 pr-3 text-sm text-body outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
      </section>

      {error ? <ErrorBlock message={error} /> : loading ? <LoadingBlock label="Loading transactions" /> : transactions.length === 0 ? <EmptyBlock title="No transactions" body="No rows match the current filters." /> : <TransactionTable transactions={transactions} onEdit={(tx) => { setSelected(tx); setDialogOpen(true); }} />}

      <div className="flex items-center justify-center gap-4 text-sm text-muted">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="inline-flex items-center gap-1 rounded-btn px-3 py-2 hover:bg-elevated disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="inline-flex items-center gap-1 rounded-btn px-3 py-2 hover:bg-elevated disabled:opacity-40">
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <EditDialog transaction={selected} open={dialogOpen} onOpenChange={setDialogOpen} onSaved={load} />
    </div>
  );
}
