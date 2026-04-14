'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectFallback({ message }: { message: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-text-muted text-sm">{message}</div>
  );
}

/** Old `/library` URLs → Research daily tab (preserve date/docKey when present). */
function LibraryToResearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const p = new URLSearchParams();
    p.set('tab', 'daily');
    const date = searchParams.get('date');
    const docKey = searchParams.get('docKey');
    if (date) p.set('date', date);
    if (docKey) p.set('docKey', docKey);
    router.replace(`/research?${p.toString()}`);
  }, [router, searchParams]);

  return <RedirectFallback message="Opening research…" />;
}

export function LibraryToResearchRedirectPage() {
  return (
    <Suspense fallback={<RedirectFallback message="Loading…" />}>
      <LibraryToResearchInner />
    </Suspense>
  );
}

/** Old `/strategy` URLs → Portfolio analysis (optional thesis deep link). */
function StrategyToAnalysisInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const thesis = searchParams.get('thesis');
    const q = new URLSearchParams();
    q.set('tab', 'analysis');
    if (thesis) q.set('thesis', thesis);
    router.replace(`/portfolio?${q.toString()}`);
  }, [router, searchParams]);

  return <RedirectFallback message="Opening analysis…" />;
}

export function StrategyToAnalysisRedirectPage() {
  return (
    <Suspense fallback={<RedirectFallback message="Loading…" />}>
      <StrategyToAnalysisInner />
    </Suspense>
  );
}

/** Old `/performance` URL → Portfolio performance tab. */
export function PerformanceToPortfolioRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/portfolio?tab=performance');
  }, [router]);

  return <RedirectFallback message="Opening performance…" />;
}
