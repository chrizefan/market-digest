import { describe, expect, it } from 'vitest';
import { runPerformanceSimulation } from './performance-simulation';
import type { TargetWeights } from './digest-targets';

function mapTargets(dates: string[], w: TargetWeights): Map<string, TargetWeights> {
  const m = new Map<string, TargetWeights>();
  for (const d of dates) m.set(d, { ...w });
  return m;
}

function closeMap(
  spec: Record<string, Record<string, number>>
): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  for (const [t, byDate] of Object.entries(spec)) {
    const inner = new Map<string, number>();
    for (const [d, p] of Object.entries(byDate)) inner.set(d, p);
    out.set(t, inner);
  }
  return out;
}

describe('runPerformanceSimulation', () => {
  const d0 = '2024-01-01';
  const d1 = '2024-01-02';
  const d2 = '2024-01-03';
  const dates = [d0, d1, d2];
  const targets: TargetWeights = { A: 50, B: 50 };

  it('indexes to 100 on day 0 and evolves over three days (daily_benchmark)', () => {
    const r = runPerformanceSimulation({
      dates,
      targetsByDate: mapTargets(dates, targets),
      priceByTickerDate: closeMap({
        A: { [d0]: 100, [d1]: 110, [d2]: 121 },
        B: { [d0]: 100, [d1]: 100, [d2]: 100 },
      }),
      params: {
        strategy: 'daily_benchmark',
        priceField: 'close',
        cost: { fixedBpsPerLeg: 0, bpsOnNotional: 0 },
      },
    });
    expect(r.valueIndex[0]).toEqual({ date: d0, value: 100 });
    expect(r.valueIndex[1].value).not.toBeNull();
    expect(r.valueIndex[1].value! > 100).toBe(true);
    expect(r.valueIndex[2].value! > r.valueIndex[1].value!).toBe(true);
    expect(r.totalCostDragPoints).toBe(0);
  });

  it('drift_band with huge threshold skips rebalance and differs from daily reset', () => {
    const d3 = '2024-01-04';
    const longDates = [d0, d1, d2, d3];
    const daily = runPerformanceSimulation({
      dates: longDates,
      targetsByDate: mapTargets(longDates, targets),
      priceByTickerDate: closeMap({
        A: { [d0]: 100, [d1]: 110, [d2]: 121, [d3]: 133.1 },
        B: { [d0]: 100, [d1]: 100, [d2]: 100, [d3]: 100 },
      }),
      params: {
        strategy: 'daily_benchmark',
        priceField: 'close',
        cost: { fixedBpsPerLeg: 0, bpsOnNotional: 0 },
      },
    });
    const drift = runPerformanceSimulation({
      dates: longDates,
      targetsByDate: mapTargets(longDates, targets),
      priceByTickerDate: closeMap({
        A: { [d0]: 100, [d1]: 110, [d2]: 121, [d3]: 133.1 },
        B: { [d0]: 100, [d1]: 100, [d2]: 100, [d3]: 100 },
      }),
      params: {
        strategy: 'drift_band',
        priceField: 'close',
        driftBandPp: 100,
        cost: { fixedBpsPerLeg: 0, bpsOnNotional: 0 },
      },
    });
    expect(drift.valueIndex[3].value).not.toEqual(daily.valueIndex[3].value);
  });

  it('subtracts fixed per-leg costs when rebalancing', () => {
    const inputs = {
      dates,
      targetsByDate: mapTargets(dates, targets),
      priceByTickerDate: closeMap({
        A: { [d0]: 100, [d1]: 110, [d2]: 110 },
        B: { [d0]: 100, [d1]: 100, [d2]: 100 },
      }),
    };
    const noCost = runPerformanceSimulation({
      ...inputs,
      params: {
        strategy: 'daily_benchmark',
        priceField: 'close',
        cost: { fixedBpsPerLeg: 0, bpsOnNotional: 0 },
      },
    });
    const withCost = runPerformanceSimulation({
      ...inputs,
      params: {
        strategy: 'daily_benchmark',
        priceField: 'close',
        cost: { fixedBpsPerLeg: 10, bpsOnNotional: 0 },
      },
    });
    expect(withCost.totalCostDragPoints).toBeGreaterThan(0);
    expect(withCost.valueIndex[2].value! < noCost.valueIndex[2].value!).toBe(true);
  });

  it('does not explode when the first NAV date is missing a close', () => {
    const r = runPerformanceSimulation({
      dates,
      targetsByDate: mapTargets(dates, targets),
      priceByTickerDate: closeMap({
        // Missing d0 close, present d1/d2.
        A: { [d1]: 150, [d2]: 150 },
        B: { [d1]: 100, [d2]: 100 },
      }),
      params: {
        strategy: 'daily_benchmark',
        priceField: 'close',
        cost: { fixedBpsPerLeg: 0, bpsOnNotional: 0 },
      },
    });
    // With forward-filled closes onto NAV dates, day 1 return should be ~1, not 150x.
    expect(r.valueIndex[1].value).toBeCloseTo(100, 6);
    expect(r.valueIndex[2].value).toBeCloseTo(100, 6);
  });
});
