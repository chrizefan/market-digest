'use client';

import { Clock } from 'lucide-react';
import { useDashboard } from '@/lib/dashboard-context';
import type { PortfolioMeta } from '@/lib/types';

interface PageHeaderProps {
  title: string;
  /** When false, header scrolls away with the page (no sticky bar under the sidebar brand). */
  sticky?: boolean;
}

export default function PageHeader({ title, sticky = true }: PageHeaderProps) {
  const { data } = useDashboard();
  const meta: PortfolioMeta | null = data?.portfolio?.meta ?? null;

  return (
    <header
      className={`flex justify-between items-center px-10 py-6 border-b border-border-subtle bg-bg-glass backdrop-blur-[12px] z-10 max-md:px-4 max-md:py-3 max-md:pl-14 ${
        sticky ? 'sticky top-0' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight max-md:text-lg max-md:truncate">{title}</h1>
        <p className="text-text-muted text-sm mt-1 max-md:hidden">
          {meta?.name ?? 'Atlas'} &bull; {meta?.base_currency ?? '—'} &bull; Inception {meta?.inception_date ?? '—'}
        </p>
      </div>
      <div className="flex items-center gap-2 text-text-muted text-sm shrink-0">
        <Clock size={16} />
        <span className="hidden sm:inline">Updated:</span> {meta?.last_updated ?? '—'}
      </div>
    </header>
  );
}
