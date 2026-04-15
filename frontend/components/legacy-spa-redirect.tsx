'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AtlasLoader from '@/components/AtlasLoader';

function RedirectFallback() {
  return <AtlasLoader fullScreen={false} />;
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

  return <RedirectFallback />;
}

export function LibraryToResearchRedirectPage() {
  return (
    <Suspense fallback={<RedirectFallback />}>
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

  return <RedirectFallback />;
}

export function StrategyToAnalysisRedirectPage() {
  return (
    <Suspense fallback={<RedirectFallback />}>
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

  return <RedirectFallback />;
}
