'use client';

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
    <AllocationsPositionsTable
      positions={positions}
      positionHistory={positionHistory}
      positionEvents={positionEvents}
      thesisById={thesisById}
      lastUpdated={lastUpdated}
    />
  );
}
