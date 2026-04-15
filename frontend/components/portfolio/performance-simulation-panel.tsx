'use client';

import { useCallback, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { RebalanceStrategy, SimulationParams } from '@/lib/performance-simulation';
import { DEFAULT_SIMULATION_PARAMS } from '@/lib/performance-simulation';

const LS_KEY = 'atlas.performanceSim.v1';

export type PerformanceSimStored = {
  strategy: RebalanceStrategy;
  driftBandPp: number;
  fixedUsdPerTrade: number;
  bpsOnNotional: number;
};

const STRATEGY_OPTIONS: { id: RebalanceStrategy; label: string; hint: string }[] = [
  { id: 'daily_benchmark', label: 'Daily rebalance (theoretical)', hint: 'Reset to digest targets each close; no drift' },
  { id: 'drift_band', label: 'Drift band', hint: 'Rebalance when any weight vs target exceeds threshold' },
  { id: 'calendar_weekly', label: 'Weekly (Fri / every 5 sessions)', hint: 'Calendar-style rebalance' },
  { id: 'calendar_monthly', label: 'Monthly (first session)', hint: 'First trading day of each month' },
  { id: 'hybrid', label: 'Hybrid', hint: 'Band or calendar, whichever triggers' },
];

function loadStored(): PerformanceSimStored {
  if (typeof window === 'undefined') {
    return {
      strategy: DEFAULT_SIMULATION_PARAMS.strategy,
      driftBandPp: DEFAULT_SIMULATION_PARAMS.driftBandPp,
      fixedUsdPerTrade: DEFAULT_SIMULATION_PARAMS.cost.fixedUsdPerTrade,
      bpsOnNotional: DEFAULT_SIMULATION_PARAMS.cost.bpsOnNotional,
    };
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) throw new Error('empty');
    const o = JSON.parse(raw) as Partial<PerformanceSimStored>;
    return {
      strategy: (o.strategy as RebalanceStrategy) ?? DEFAULT_SIMULATION_PARAMS.strategy,
      driftBandPp: typeof o.driftBandPp === 'number' ? o.driftBandPp : DEFAULT_SIMULATION_PARAMS.driftBandPp,
      fixedUsdPerTrade:
        typeof o.fixedUsdPerTrade === 'number' ? o.fixedUsdPerTrade : DEFAULT_SIMULATION_PARAMS.cost.fixedUsdPerTrade,
      bpsOnNotional:
        typeof o.bpsOnNotional === 'number' ? o.bpsOnNotional : DEFAULT_SIMULATION_PARAMS.cost.bpsOnNotional,
    };
  } catch {
    return {
      strategy: DEFAULT_SIMULATION_PARAMS.strategy,
      driftBandPp: DEFAULT_SIMULATION_PARAMS.driftBandPp,
      fixedUsdPerTrade: DEFAULT_SIMULATION_PARAMS.cost.fixedUsdPerTrade,
      bpsOnNotional: DEFAULT_SIMULATION_PARAMS.cost.bpsOnNotional,
    };
  }
}

export function usePerformanceSimParams(): {
  params: SimulationParams;
  stored: PerformanceSimStored;
  setStored: (u: Partial<PerformanceSimStored>) => void;
} {
  const [stored, setState] = useState<PerformanceSimStored>(() => loadStored());

  const setStored = useCallback((u: Partial<PerformanceSimStored>) => {
    setState((prev) => {
      const next = { ...prev, ...u };
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  const params: SimulationParams = {
    strategy: stored.strategy,
    driftBandPp: stored.driftBandPp,
    cost: {
      fixedUsdPerTrade: stored.fixedUsdPerTrade,
      bpsOnNotional: stored.bpsOnNotional,
    },
  };

  return { params, stored, setStored };
}

export function PerformanceSimulationPanel({
  stored,
  setStored,
  simLoading,
  simError,
  totalCostDrag,
}: {
  stored: PerformanceSimStored;
  setStored: (u: Partial<PerformanceSimStored>) => void;
  simLoading: boolean;
  simError: string | null;
  totalCostDrag: number | null;
}) {
  const [open, setOpen] = useState(true);

  const showBand = stored.strategy === 'drift_band' || stored.strategy === 'hybrid';

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-secondary/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
      >
        <div>
          <p className="text-sm font-semibold">Theoretical portfolio simulation</p>
          <p className="text-[11px] text-text-muted mt-0.5">
            Digest targets + prices; does not replace recorded NAV. For analysis only.
          </p>
        </div>
        {open ? <ChevronUp size={18} className="text-text-muted shrink-0" /> : <ChevronDown size={18} className="text-text-muted shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-border-subtle/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
            <label className="space-y-1 block text-xs">
              <span className="text-text-muted">Custom strategy</span>
              <select
                value={stored.strategy}
                onChange={(e) => setStored({ strategy: e.target.value as RebalanceStrategy })}
                className="w-full rounded-md border border-border-subtle bg-bg-primary px-2 py-1.5 text-sm text-text-primary"
              >
                {STRATEGY_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id} title={o.hint}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {showBand ? (
              <label className="space-y-1 block text-xs">
                <span className="text-text-muted">Drift band (pp vs target)</span>
                <input
                  type="number"
                  min={0.5}
                  max={50}
                  step={0.5}
                  value={stored.driftBandPp}
                  onChange={(e) => setStored({ driftBandPp: Number(e.target.value) || 5 })}
                  className="w-full rounded-md border border-border-subtle bg-bg-primary px-2 py-1.5 text-sm font-mono"
                />
              </label>
            ) : (
              <div />
            )}
            <label className="space-y-1 block text-xs">
              <span className="text-text-muted">Cost: $ per ticker traded</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={stored.fixedUsdPerTrade}
                onChange={(e) => setStored({ fixedUsdPerTrade: Number(e.target.value) || 0 })}
                className="w-full rounded-md border border-border-subtle bg-bg-primary px-2 py-1.5 text-sm font-mono"
              />
            </label>
            <label className="space-y-1 block text-xs">
              <span className="text-text-muted">Cost: bps on turnover notional</span>
              <input
                type="number"
                min={0}
                max={500}
                step={1}
                value={stored.bpsOnNotional}
                onChange={(e) => setStored({ bpsOnNotional: Number(e.target.value) || 0 })}
                className="w-full rounded-md border border-border-subtle bg-bg-primary px-2 py-1.5 text-sm font-mono"
              />
            </label>
          </div>
          {simLoading ? (
            <p className="text-xs text-text-muted">Loading simulation…</p>
          ) : simError ? (
            <p className="text-xs text-fin-red">{simError}</p>
          ) : totalCostDrag != null && totalCostDrag > 0 ? (
            <p className="text-xs text-text-muted">
              Cumulative drag from simulated costs in window:{' '}
              <span className="font-mono text-text-secondary">{totalCostDrag.toFixed(4)}</span> (index units)
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
