'use client';

import { useEffect, useState } from 'react';
import { DebtCard } from '@/components/debts/debt-card';
import { PaymentDialog } from '@/components/debts/payment-dialog';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/state';
import { formatAmount } from '@/lib/format';
import { PREVIEW_DEBTS } from '@/lib/preview-data';
import { Debt } from '@/lib/types';

interface DebtsResponse {
  personal: Debt[];
  business: Debt[];
  error?: string;
}

export default function DebtsPage() {
  const [personal, setPersonal] = useState<Debt[]>([]);
  const [business, setBusiness] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Debt | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function load() {
    setLoading(true);
    if (new URLSearchParams(window.location.search).get('preview') === '1') {
      setPersonal(PREVIEW_DEBTS.filter((debt) => debt.type === 'personal'));
      setBusiness(PREVIEW_DEBTS.filter((debt) => debt.type === 'business'));
      setError('');
      setLoading(false);
      return;
    }
    fetch('/api/debts')
      .then(async (res) => {
        const body = (await res.json()) as DebtsResponse;
        if (!res.ok) throw new Error(body.error ?? 'Debt request failed.');
        setPersonal(body.personal);
        setBusiness(body.business);
        setError('');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  if (error) return <ErrorBlock message={error} />;
  if (loading) return <LoadingBlock label="Loading debts" />;

  const personalTotal = personal.reduce((sum, debt) => sum + debt.remaining_amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-on-dark">Debts</h1>
        <p className="mt-1 text-sm text-muted">Separate your personal pressure from AGA liabilities.</p>
      </div>
      {personal.length + business.length === 0 ? <EmptyBlock title="No active debts" body="Active debts from Supabase will appear here." /> : null}
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-on-dark">Your personal debts</h2>
          {personal.map((debt) => <DebtCard key={debt.id} debt={debt} onPay={(item) => { setSelected(item); setDialogOpen(true); }} />)}
          <div className="rounded-card border border-hairline bg-elevated p-4 font-num text-base font-bold text-primary">Total personal: RM {formatAmount(personalTotal)}</div>
        </div>
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-muted">AGA business debts</h2>
            <p className="mt-1 text-xs text-down">These are AGA&apos;s liability. Do not use your salary for these.</p>
          </div>
          {business.map((debt) => <DebtCard key={debt.id} debt={debt} business onPay={(item) => { setSelected(item); setDialogOpen(true); }} />)}
        </div>
      </section>
      <PaymentDialog debt={selected} open={dialogOpen} onOpenChange={setDialogOpen} onPaid={load} />
    </div>
  );
}
