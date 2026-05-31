'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { currentMonthKey } from '@/lib/format';
import { Debt } from '@/lib/types';

export function PaymentDialog({ debt, open, onOpenChange, onPaid }: { debt: Debt | null; open: boolean; onOpenChange: (open: boolean) => void; onPaid: () => void }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(`${currentMonthKey()}-01`);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!debt) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/debts/${debt.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), date, notes })
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Payment failed.');
      onPaid();
      onOpenChange(false);
      setAmount('');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-hairline bg-card p-6 text-body">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-lg font-semibold text-on-dark">Mark Payment</Dialog.Title>
            <Dialog.Close className="rounded-btn p-1 text-muted hover:bg-elevated hover:text-body">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block text-xs font-medium text-muted">
              Amount
              <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0" step="0.01" className="mt-2 h-10 w-full rounded-input border border-hairline bg-elevated px-3 text-sm text-body outline-none focus:ring-2 focus:ring-primary/30" />
            </label>
            <label className="block text-xs font-medium text-muted">
              Date
              <input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="mt-2 h-10 w-full rounded-input border border-hairline bg-elevated px-3 text-sm text-body outline-none focus:ring-2 focus:ring-primary/30" />
            </label>
            <label className="block text-xs font-medium text-muted">
              Notes
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 min-h-20 w-full resize-none rounded-input border border-hairline bg-elevated px-3 py-2 text-sm text-body outline-none focus:ring-2 focus:ring-primary/30" />
            </label>
            {error ? <p className="text-sm text-down">{error}</p> : null}
            <div className="flex gap-3">
              <button disabled={saving} className="h-10 rounded-btn bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-active disabled:opacity-60">{saving ? 'Saving' : 'Confirm'}</button>
              <Dialog.Close className="h-10 rounded-btn bg-elevated px-4 text-sm font-semibold text-body hover:text-on-dark">Cancel</Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
