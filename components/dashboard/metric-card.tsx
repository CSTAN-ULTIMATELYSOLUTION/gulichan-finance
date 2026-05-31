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
  return (
    <section className="rounded-card border border-hairline bg-card p-6">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className={`mt-3 truncate font-num text-[28px] font-bold leading-tight sm:text-[32px] ${color}`}>RM {formatAmount(value)}</div>
      <div className="mt-2 text-xs text-muted">{sub}</div>
    </section>
  );
}
