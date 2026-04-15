'use client';

import { SectionTitle } from '@/components/ui';
import type { Position, PositionHistoryRow, Thesis } from '@/lib/types';
import AllocationsPositionsTable from '@/components/portfolio/AllocationsPositionsTable';

export default function AllocationsTab(props: {
  lastUpdated: string | null;
  positions: Position[];
  positionHistory: PositionHistoryRow[];
  thesisById: Map<string, Thesis>;
}) {
  const { lastUpdated, positions, positionHistory, thesisById } = props;

  return (
    <div className="space-y-6">
      <div className="px-1">
        <SectionTitle className="mb-1">Allocations</SectionTitle>
      </div>

      <AllocationsPositionsTable
        positions={positions}
        positionHistory={positionHistory}
        thesisById={thesisById}
        lastUpdated={lastUpdated}
      />
    </div>
  );
}
