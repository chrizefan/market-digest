import { Suspense } from 'react';
import StrategyClient from './strategy-client';

export default function StrategyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-text-secondary">Loading…</div>
      }
    >
      <StrategyClient />
    </Suspense>
  );
}
