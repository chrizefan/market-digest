import { describe, expect, it } from 'vitest';
import {
  forwardFillTargetsForNavDates,
  normalizeTargetWeights,
  parseProposedPositionsFromSnapshot,
} from './digest-targets';

describe('parseProposedPositionsFromSnapshot', () => {
  it('extracts ticker weights from snapshot JSON', () => {
    const snap = {
      portfolio: {
        proposed_positions: [
          { ticker: 'spy', weight_pct: 60 },
          { ticker: 'qqq', weight_pct: 40 },
        ],
      },
    };
    const w = parseProposedPositionsFromSnapshot(snap);
    expect(w).toEqual({ SPY: 60, QQQ: 40 });
  });

  it('returns null when proposed_positions missing', () => {
    expect(parseProposedPositionsFromSnapshot({ portfolio: {} })).toBeNull();
    expect(parseProposedPositionsFromSnapshot(null)).toBeNull();
  });
});

describe('normalizeTargetWeights', () => {
  it('rescales to sum 100', () => {
    const n = normalizeTargetWeights({ A: 30, B: 30 });
    expect(n.A + n.B).toBeCloseTo(100, 5);
    expect(n.A).toBeCloseTo(50, 5);
    expect(n.B).toBeCloseTo(50, 5);
  });
});

describe('forwardFillTargetsForNavDates', () => {
  it('carries last full vector when a day has no snapshot row', () => {
    const nav = ['2024-01-01', '2024-01-02', '2024-01-03'];
    const rows = [{ date: '2024-01-02', weights: { A: 50, B: 50 } }];
    const m = forwardFillTargetsForNavDates(nav, rows);
    expect(m.get('2024-01-01')).toEqual(m.get('2024-01-02'));
    expect(m.get('2024-01-03')).toEqual(m.get('2024-01-02'));
  });

  it('updates when a new snapshot appears on or before NAV date', () => {
    const nav = ['2024-01-01', '2024-01-05'];
    const rows: Array<{ date: string; weights: Record<string, number> }> = [
      { date: '2024-01-01', weights: { A: 100 } },
      { date: '2024-01-05', weights: { A: 80, B: 20 } },
    ];
    const m = forwardFillTargetsForNavDates(nav, rows);
    expect(m.get('2024-01-01')).toMatchObject({ A: 100 });
    expect(m.get('2024-01-05')).toMatchObject({ A: 80, B: 20 });
  });
});
