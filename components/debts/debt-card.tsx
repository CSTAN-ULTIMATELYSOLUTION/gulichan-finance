'use client';

import { formatAmount, pct } from '@/lib/format';
import { Debt } from '@/lib/types';

export function DebtCard({ debt, business, onPay }: { debt: Debt; business?: boolean; onPay: (debt: Debt) => void }) {
  const progress = pct(debt.paid_amount, debt.original_amount);
  return (
    <article className="rounded-card border border-hairline bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-on-dark">{debt.creditor}</h3>
        <div className="flex gap-2">
          <span className="rounded-full bg-elevated px-2 py-1 text-[11px] font-medium text-muted">{debt.status}</span>
          {debt.target_clear_date ? <span className="rounded-full border border-primary/40 px-2 py-1 text-[11px] font-medium text-primary">{debt.target_clear_date}</span> : null}
        </div>
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-elevated">
        <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className={`font-num text-xl font-bold ${business ? 'text-primary' : 'text-down'}`}>RM {formatAmount(debt.remaining_amount)}</div>
        <div className="text-xs text-muted">RM {formatAmount(debt.paid_amount)} paid</div>
      </div>
      {debt.notes ? <p className="mt-3 text-xs text-muted">{debt.notes}</p> : null}
      <button onClick={() => onPay(debt)} className="mt-5 h-8 rounded-btn bg-primary px-3 text-xs font-semibold text-on-primary hover:bg-primary-active">
        Mark Payment
      </button>
    </article>
  );
}
