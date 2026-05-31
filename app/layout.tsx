import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bossku Finance OS',
  description: 'Personal finance operating system for Malaysian cashflow, debts, and budgets.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
