'use client';

import { Pencil } from 'lucide-react';
import { CATEGORY_COLORS, CATEGORY_LABELS, Transaction } from '@/lib/types';
import { formatAmount } from '@/lib/format';

export function TransactionTable({ transactions, onEdit }: { transactions: Transaction[]; onEdit: (transaction: Transaction) => void }) {
  return (
    <div className="overflow-x-auto rounded-card border border-hairline bg-card scrollbar-thin">
      <table className="min-w-[900px] w-full border-collapse">
        <thead>
          <tr className="border-b border-hairline text-left text-xs font-medium text-muted">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Account</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="group border-b border-hairline last:border-b-0">
              <td className="whitespace-nowrap px-4 py-3 text-[13px] text-body">{tx.date}</td>
              <td className="max-w-[320px] truncate px-4 py-3 text-[13px] font-medium text-on-dark">{tx.description}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-elevated px-2 py-1 text-xs text-[#929aa5]">{tx.account?.name ?? 'Unknown'}</span>
              </td>
              <td className="px-4 py-3">
                <span
                  className="rounded-full px-2 py-1 text-xs font-medium"
                  style={{ color: CATEGORY_COLORS[tx.category], backgroundColor: `${CATEGORY_COLORS[tx.category]}18` }}
                >
                  {CATEGORY_LABELS[tx.category]}
                </span>
              </td>
              <td className={`px-4 py-3 text-right font-num text-sm font-medium ${tx.direction === 'in' ? 'text-up' : 'text-down'}`}>
                RM {formatAmount(tx.amount)}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onEdit(tx)}
                  className="rounded-btn p-1.5 text-muted opacity-100 transition hover:bg-elevated hover:text-body sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="Edit transaction"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
