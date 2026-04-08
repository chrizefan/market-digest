import { Suspense } from 'react';

import LibraryClient from './LibraryClient';

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-text-secondary">Loading…</div>}>
      <LibraryClient />
    </Suspense>
  );
}
