'use client';

import { SectionTitle } from '@/components/ui';
import type { DashboardPositionEvent, Position, PositionHistoryRow, Thesis } from '@/lib/types';
import AllocationsPositionsTable from '@/components/portfolio/AllocationsPositionsTable';

export default function AllocationsTab(props: {
  lastUpdated: string | null;
  positions: Position[];
  positionHistory: PositionHistoryRow[];
  positionEvents: DashboardPositionEvent[];
  thesisById: Map<string, Thesis>;
}) {
  const { lastUpdated, positions, positionHistory, positionEvents, thesisById } = props;

  return (
    <div className="space-y-6">
      <div className="px-1">
        <SectionTitle className="mb-1">Allocations</SectionTitle>
      </div>

      <AllocationsPositionsTable
        positions={positions}
        positionHistory={positionHistory}
        positionEvents={positionEvents}
        thesisById={thesisById}
        lastUpdated={lastUpdated}
      />
    </div>
  );
}
