'use client';

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
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
  const [strategyOpen, setStrategyOpen] = useState(false);
  const strategyRootRef = useRef<HTMLDivElement>(null);

  const showBand = stored.strategy === 'drift_band' || stored.strategy === 'hybrid';
  const strategyLabel = useMemo(
    () => STRATEGY_OPTIONS.find((o) => o.id === stored.strategy)?.label ?? stored.strategy,
    [stored.strategy]
  );
  const strategyHint = useMemo(
    () => STRATEGY_OPTIONS.find((o) => o.id === stored.strategy)?.hint ?? null,
    [stored.strategy]
  );

  useEffect(() => {
    if (!strategyOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (strategyRootRef.current && !strategyRootRef.current.contains(e.target as Node)) {
        setStrategyOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [strategyOpen]);

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
            <div className="space-y-1">
              <p className="text-xs text-text-muted">Strategy</p>
              <div ref={strategyRootRef} className="relative">
                <button
                  type="button"
                  onClick={() => setStrategyOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-controls="perf-sim-strategy-listbox"
                  className="w-full inline-flex items-center justify-between gap-2 rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-sm text-text-primary hover:border-fin-blue/40 hover:bg-white/[0.03] transition-colors focus:outline-none focus:ring-1 focus:ring-fin-blue/30"
                >
                  <span className="truncate">{strategyLabel}</span>
                  <ChevronDown
                    size={16}
                    className={`text-text-muted shrink-0 transition-transform ${strategyOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {strategyOpen && (
                  <div className="absolute left-0 top-full z-[70] mt-1 w-full rounded-lg border border-border-subtle bg-[#141414] shadow-xl overflow-hidden">
                    <div
                      id="perf-sim-strategy-listbox"
                      role="listbox"
                      aria-label="Simulation strategy"
                      className="py-1 max-h-64 overflow-y-auto"
                    >
                      {STRATEGY_OPTIONS.map((o) => {
                        const selected = stored.strategy === o.id;
                        return (
                          <button
                            key={o.id}
                            type="button"
                            role="option"
                            onClick={() => {
                              setStored({ strategy: o.id });
                              setStrategyOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                              selected
                                ? 'bg-fin-blue/15 text-fin-blue'
                                : 'text-text-secondary hover:bg-white/[0.06] hover:text-text-primary'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{o.label}</span>
                              {selected && <span className="text-[10px] uppercase tracking-wider">Selected</span>}
                            </div>
                            <p className="mt-0.5 text-[11px] text-text-muted leading-snug">{o.hint}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {strategyHint && <p className="text-[11px] text-text-muted leading-snug">{strategyHint}</p>}
            </div>
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
                  className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-fin-blue/30"
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
                className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-fin-blue/30"
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
                className="w-full rounded-md border border-border-subtle bg-bg-primary px-3 py-2 text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-fin-blue/30"
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
