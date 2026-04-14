import { Suspense } from 'react';
import ResearchClient from './ResearchClient';

export default function ResearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-text-secondary">Loading…</div>}>
      <ResearchClient />
    </Suspense>
  );
}
