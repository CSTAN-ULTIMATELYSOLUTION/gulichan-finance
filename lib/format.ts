export function formatAmount(amount: number) {
  return amount.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function monthLabel(month: string) {
  const [year, rawMonth] = month.split('-');
  const date = new Date(Number(year), Number(rawMonth) - 1, 1);
  return date.toLocaleString('en-MY', { month: 'short' });
}

export function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

export function pct(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.min(100, Math.max(0, (numerator / denominator) * 100));
}
