'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CATEGORY_COLORS, CATEGORY_LABELS, CategorySummary } from '@/lib/types';
import { formatAmount } from '@/lib/format';

export function CategoryDonut({ data }: { data: CategorySummary[] }) {
  const total = data.reduce((sum, row) => sum + row.total_spent, 0);
  return (
    <section className="h-[360px] rounded-card border border-hairline bg-card p-6">
      <h2 className="mb-6 text-xl font-semibold text-on-dark">Spending Mix</h2>
      <div className="relative h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="total_spent" nameKey="category" innerRadius={64} outerRadius={104} stroke="#1e2329" strokeWidth={3}>
              {data.map((row) => (
                <Cell key={row.category} fill={CATEGORY_COLORS[row.category]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1e2329', border: '1px solid #2b3139', color: '#eaecef', borderRadius: 8 }}
              formatter={(value: number, name: string) => [`RM ${formatAmount(Number(value))}`, CATEGORY_LABELS[name as keyof typeof CATEGORY_LABELS]]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-medium text-muted">This Month</span>
          <span className="mt-1 font-num text-lg font-bold text-primary">RM {formatAmount(total)}</span>
        </div>
      </div>
    </section>
  );
}
