import { Suspense } from 'react';
import PortfolioShellInner from '@/components/portfolio/PortfolioShellInner';

export default function PortfolioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen text-text-secondary">Loading…</div>
      }
    >
      <PortfolioShellInner />
    </Suspense>
  );
}
