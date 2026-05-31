'use client';

import clsx from 'clsx';
import { AlertCircle, BarChart3, LayoutDashboard, List, Upload } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: List },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/debts', label: 'Debts', icon: AlertCircle },
  { href: '/budget', label: 'Budget', icon: BarChart3 }
];

export function Sidebar() {
  const pathname = usePathname();
  const month = new Date().toLocaleString('en-MY', { month: 'long', year: 'numeric' });

  return (
    <>
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-60 border-r border-hairline bg-card lg:flex lg:flex-col">
        <div className="px-6 py-6 text-sm font-semibold tracking-[0.16em] text-primary">BOSSKU FINANCE</div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex h-11 items-center gap-3 rounded-btn border-l-[3px] px-3 text-sm font-medium transition',
                  active
                    ? 'border-primary bg-elevated text-body'
                    : 'border-transparent text-muted hover:bg-elevated hover:text-body'
                )}
              >
                <Icon className={clsx('h-4 w-4', active && 'text-primary')} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-hairline px-6 py-5 text-xs font-medium text-muted">{month}</div>
      </aside>

      <nav className="fixed bottom-0 left-0 z-30 grid h-16 w-full grid-cols-5 border-t border-hairline bg-card lg:hidden">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted">
              <Icon className={clsx('h-5 w-5', active ? 'text-primary' : 'text-muted')} />
              <span className={active ? 'text-primary' : 'text-muted'}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
