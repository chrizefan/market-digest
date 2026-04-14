'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PerformancePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/portfolio?tab=performance');
  }, [router]);
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-text-muted text-sm">
      Opening performance…
    </div>
  );
}
