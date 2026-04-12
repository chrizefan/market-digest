import { Suspense } from 'react';
import StrategyRedirect from './strategy-redirect';

export default function StrategyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-text-secondary">Loading…</div>
      }
    >
      <StrategyRedirect />
    </Suspense>
  );
}
