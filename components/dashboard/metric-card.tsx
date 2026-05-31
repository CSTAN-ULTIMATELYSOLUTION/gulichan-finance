import { formatAmount } from '@/lib/format';

export function MetricCard({
  label,
  value,
  sub,
  tone
}: {
  label: string;
  value: number;
  sub: string;
  tone: 'up' | 'down' | 'primary';
}) {
  const color = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-primary';
  const amount = formatAmount(value);
  const amountSize = amount.length > 9 ? 'text-[24px] sm:text-[28px] xl:text-[26px] 2xl:text-[30px]' : 'text-[28px] sm:text-[32px]';

  return (
    <section className="rounded-card border border-hairline bg-card p-6">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className={`mt-3 whitespace-nowrap font-num font-bold leading-tight ${amountSize} ${color}`}>RM {amount}</div>
      <div className="mt-2 text-xs text-muted">{sub}</div>
    </section>
  );
}
