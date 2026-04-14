'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/** Legacy `/strategy` → Portfolio: `thesis` opens Theses; otherwise PM analysis. */
export default function StrategyRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const thesis = searchParams.get('thesis');
    const q = new URLSearchParams();
    if (thesis) {
      q.set('tab', 'theses');
      q.set('thesis', thesis);
    } else {
      q.set('tab', 'pm_analysis');
    }
    router.replace(`/portfolio?${q.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-text-muted text-sm">
      Opening analysis…
    </div>
  );
}
