'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/** Legacy `/strategy` → Portfolio Analysis (optional `thesis` deep link). */
export default function StrategyRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const thesis = searchParams.get('thesis');
    const q = new URLSearchParams();
    q.set('tab', 'analysis');
    if (thesis) q.set('thesis', thesis);
    router.replace(`/portfolio?${q.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-text-muted text-sm">
      Opening analysis…
    </div>
  );
}
