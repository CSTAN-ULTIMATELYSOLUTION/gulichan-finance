'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { CATEGORIES, CATEGORY_LABELS, Transaction, TransactionCategory } from '@/lib/types';

export function EditDialog({
  transaction,
  open,
  onOpenChange,
  onSaved
}: {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [category, setCategory] = useState<TransactionCategory>('uncategorised');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleOpenChange(nextOpen: boolean) {
    if (transaction && nextOpen) {
      setCategory(transaction.category);
      setNotes(transaction.notes ?? '');
      setError('');
    }
    onOpenChange(nextOpen);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!transaction) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, notes })
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Save failed.');
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-hairline bg-card p-6 text-body">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-lg font-semibold text-on-dark">Edit transaction</Dialog.Title>
            <Dialog.Close className="rounded-btn p-1 text-muted hover:bg-elevated hover:text-body">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <form onSubmit={save} className="mt-5 space-y-4">
            <label className="block text-xs font-medium text-muted">
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as TransactionCategory)}
                className="mt-2 h-10 w-full rounded-input border border-hairline bg-elevated px-3 text-sm text-body outline-none focus:ring-2 focus:ring-primary/30"
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {CATEGORY_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-muted">
              Notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-2 min-h-24 w-full resize-none rounded-input border border-hairline bg-elevated px-3 py-2 text-sm text-body outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            {error ? <p className="text-sm text-down">{error}</p> : null}
            <button disabled={saving} className="h-10 rounded-btn bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-active disabled:opacity-60">
              {saving ? 'Saving' : 'Save'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
