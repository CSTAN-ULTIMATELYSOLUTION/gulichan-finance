import { formatAmount, pct } from '@/lib/format';
import { Debt } from '@/lib/types';

export function DebtProgress({ title, debts, muted = false }: { title: string; debts: Debt[]; muted?: boolean }) {
  return (
    <section className="rounded-card border border-hairline bg-card p-6">
      <h2 className={muted ? 'text-base font-semibold text-muted' : 'text-base font-semibold text-on-dark'}>{title}</h2>
      <div className="mt-5 space-y-4">
        {debts.length === 0 ? <p className="text-sm text-muted">No active debts.</p> : null}
        {debts.map((debt) => {
          const progress = pct(debt.paid_amount, debt.original_amount);
          return (
            <div key={debt.id} className="border-b border-hairline pb-4 last:border-b-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-on-dark">{debt.creditor}</div>
                {debt.target_clear_date ? (
                  <div className="rounded-full border border-primary/40 px-2 py-1 text-[11px] font-medium text-primary">{debt.target_clear_date}</div>
                ) : null}
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-elevated">
                <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div className={`font-num text-sm font-medium ${muted ? 'text-primary' : 'text-down'}`}>RM {formatAmount(debt.remaining_amount)} remaining</div>
                <div className="text-xs text-muted">RM {formatAmount(debt.paid_amount)} paid</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
