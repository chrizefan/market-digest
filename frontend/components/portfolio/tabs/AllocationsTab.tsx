'use client';

import { SectionTitle } from '@/components/ui';
import type { Position, Thesis } from '@/lib/types';
import AllocationsPositionsTable from '@/components/portfolio/AllocationsPositionsTable';

export default function AllocationsTab(props: {
  lastUpdated: string | null;
  positions: Position[];
  thesisById: Map<string, Thesis>;
}) {
  const { lastUpdated, positions, thesisById } = props;

  return (
    <div className="space-y-6">
      <div className="px-1">
        <SectionTitle className="mb-1">Allocations</SectionTitle>
        <p className="text-xs text-text-muted">
          Positions are ordered by allocation weight. Each row uses a proportional background bar for quick scanning.
        </p>
      </div>

      <AllocationsPositionsTable positions={positions} thesisById={thesisById} lastUpdated={lastUpdated} />
    </div>
  );
}
