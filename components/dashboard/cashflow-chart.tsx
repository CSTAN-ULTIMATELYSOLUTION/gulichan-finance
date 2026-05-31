'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatAmount, monthLabel } from '@/lib/format';
import { MonthlySummary } from '@/lib/types';

export function CashflowChart({ data }: { data: MonthlySummary[] }) {
  const rows = [...data].reverse().map((row) => ({ ...row, label: monthLabel(row.month) }));
  return (
    <section className="h-[360px] rounded-card border border-hairline bg-card p-6">
      <h2 className="mb-6 text-xl font-semibold text-on-dark">Cashflow</h2>
      <ResponsiveContainer width="100%" height="84%">
        <BarChart data={rows}>
          <CartesianGrid stroke="#2b3139" vertical={false} />
          <XAxis dataKey="label" stroke="#707a8a" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis stroke="#707a8a" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `${Number(value) / 1000}k`} />
          <Tooltip
            cursor={{ fill: '#2b3139' }}
            contentStyle={{ background: '#1e2329', border: '1px solid #2b3139', color: '#eaecef', borderRadius: 8 }}
            formatter={(value: number) => [`RM ${formatAmount(Number(value))}`, '']}
          />
          <Bar dataKey="salary_income" fill="#0ecb81" radius={[6, 6, 0, 0]} />
          <Bar dataKey="personal_costs" fill="#f6465d" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
