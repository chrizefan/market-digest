'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LibraryRedirectInner() {
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

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-text-muted text-sm">
      Opening research…
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-text-muted text-sm">Loading…</div>}>
      <LibraryRedirectInner />
    </Suspense>
  );
}
