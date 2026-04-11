'use client';

import { useMemo, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/page-header';
import { StatCard, formatPct, pnlColor } from '@/components/ui';
import { TrendingUp, BarChart3, Activity, Target, ChevronDown, ChevronUp } from 'lucide-react';
import type { NavChartPoint, PerfChartPoint } from '@/lib/types';
import { PositionPnlTable } from '@/components/portfolio/position-pnl-table';
import { AdvancedStatsPanel } from '@/components/portfolio/advanced-stats-panel';
import { PerformanceDateRange } from '@/components/portfolio/performance-date-range';
import { ServerMetricsStrip } from '@/components/portfolio/server-metrics-strip';
import { PerformanceChartWorkspace } from '@/components/portfolio/performance-chart-workspace';
import {
  filterByDateRange,
  parseDateRangeKey,
  parseChartViewKey,
  buildDrawdownSeries,
  buildRollingSharpeVol,
  type DateRangeKey,
  type PerformanceChartView,
} from '@/lib/performance-series';

function fmtNav(v: number | null | undefined): string {
  if (v == null) return '—';
  return v.toFixed(2);
}

function dayReturn(snaps: NavChartPoint[]): number | null {
  if (!snaps || snaps.length < 2) return null;
  const prev = snaps[snaps.length - 2].nav;
  const curr = snaps[snaps.length - 1].nav;
  if (!prev) return null;
  return ((curr - prev) / prev) * 100;
}

function periodReturnPct(snaps: NavChartPoint[]): number | null {
  if (!snaps || snaps.length < 2) return null;
  const first = snaps[0].nav;
  const last = snaps[snaps.length - 1].nav;
  if (!first || first <= 0) return null;
  return (last / first - 1) * 100;
}

function PerformanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const range = parseDateRangeKey(searchParams.get('range'));
  const view = parseChartViewKey(searchParams.get('view'));

  const setRange = useCallback(
    (k: DateRangeKey) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set('range', k);
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setView = useCallback(
    (v: PerformanceChartView) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set('view', v);
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const { data, loading, error } = useDashboard();
  /** When null, comparables default to SPY+QQQ (or first two with data). */
  const [comparableOverride, setComparableOverride] = useState<string[] | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const positions = useMemo(() => data?.positions ?? [], [data]);
  const benchmarks = useMemo(() => data?.benchmarks ?? {}, [data]);
  const metrics = data?.calculated;
  const serverMetrics = data?.server_portfolio_metrics ?? null;
  const allSnaps = useMemo(() => data?.portfolio?.snapshots ?? [], [data]);

  const snaps = useMemo(() => filterByDateRange(allSnaps, range), [allSnaps, range]);

  const availBenchmarks = useMemo(() => Object.keys(benchmarks).sort(), [benchmarks]);

  const defaultComparableSelection = useMemo(() => {
    const withData = availBenchmarks.filter((b) => (benchmarks[b]?.history?.length ?? 0) > 1);
    if (withData.length === 0) return [];
    const preferred = ['SPY', 'QQQ'].filter((b) => withData.includes(b));
    return preferred.length > 0 ? preferred : withData.slice(0, Math.min(2, withData.length));
  }, [availBenchmarks, benchmarks]);

  const selectedBenchmarks = comparableOverride ?? defaultComparableSelection;

  const latestNav = snaps.length ? snaps[snaps.length - 1].nav : 100;
  const dailyRet = dayReturn(snaps);
  const rangeReturn = periodReturnPct(snaps);

  const chartData = useMemo<PerfChartPoint[]>(() => {
    const snapMap: Record<string, number | null> = {};
    snaps.forEach((s) => {
      snapMap[s.date] = s.nav;
    });

    const inceptionDate = snaps.length ? snaps[0].date : null;
    if (!inceptionDate) return [];

    const firstNav = snaps[0].nav;
    const dateSet = new Set(snaps.map((s) => s.date));

    selectedBenchmarks.forEach((b) => {
      (benchmarks[b]?.history || [])
        .filter((h) => h.date >= inceptionDate)
        .forEach((h) => dateSet.add(h.date));
    });

    const allDates = [...dateSet].filter((d) => d >= inceptionDate).sort();

    const bases: Record<string, number> = {};
    selectedBenchmarks.forEach((b) => {
      const hist = (benchmarks[b]?.history || []).filter((h) => h.date >= inceptionDate);
      if (hist.length) bases[b] = hist[0].price;
    });

    const benchMaps: Record<string, Record<string, number>> = {};
    selectedBenchmarks.forEach((b) => {
      const m: Record<string, number> = {};
      (benchmarks[b]?.history || [])
        .filter((h) => h.date >= inceptionDate)
        .forEach((h) => {
          m[h.date] = h.price;
        });
      benchMaps[b] = m;
    });

    return allDates.map((d) => {
      const rawNav = snapMap[d];
      const row: PerfChartPoint = {
        date: d,
        portfolio:
          rawNav != null && firstNav > 0 ? +((rawNav / firstNav) * 100).toFixed(2) : null,
      };
      selectedBenchmarks.forEach((b) => {
        const p = benchMaps[b]?.[d];
        row[b] = p != null && bases[b] ? +((p / bases[b]) * 100).toFixed(2) : null;
      });
      return row;
    });
  }, [snaps, benchmarks, selectedBenchmarks]);

  const drawdownData = useMemo(() => buildDrawdownSeries(snaps), [snaps]);
  const rollingData = useMemo(() => buildRollingSharpeVol(snaps, 21), [snaps]);

  const toggleBenchmark = useCallback(
    (b: string) => {
      setComparableOverride((prev) => {
        const cur = prev ?? defaultComparableSelection;
        return cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b];
      });
    },
    [defaultComparableSelection]
  );

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-text-secondary">Loading…</div>
    );
  if (error || !data || !metrics)
    return (
      <div className="flex items-center justify-center h-screen text-fin-red">
        {error || 'Failed to load'}
      </div>
    );

  const totalReturnLabel = range === 'itd' ? 'Since inception' : 'Selected range';
  const totalReturnValue =
    range === 'itd' ? formatPct(metrics.portfolio_pnl) : formatPct(rangeReturn);

  return (
    <>
      <PageHeader title="Performance" />
      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-6 max-md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-muted">
            Pick one chart below; date range applies to all series. Comparables match the same window (indexed to
            100 at window start).
          </p>
          <PerformanceDateRange value={range} onChange={setRange} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Portfolio NAV"
            value={fmtNav(latestNav)}
            icon={TrendingUp}
            iconColor="text-fin-blue"
            subtitle="End of range (level)"
          />
          <StatCard
            label="Total Return"
            value={totalReturnValue}
            valueClass={pnlColor(range === 'itd' ? metrics.portfolio_pnl : rangeReturn)}
            icon={BarChart3}
            iconColor="text-fin-green"
            subtitle={totalReturnLabel}
          />
          <StatCard
            label="Daily P&L"
            value={dailyRet != null ? formatPct(dailyRet) : '—'}
            valueClass={pnlColor(dailyRet)}
            icon={Activity}
            iconColor="text-fin-amber"
            subtitle="Last day in range"
          />
          <StatCard
            label="Active Positions"
            value={positions.length}
            icon={Target}
            iconColor="text-fin-purple"
          />
        </div>

        <PerformanceChartWorkspace
          view={view}
          onViewChange={setView}
          chartData={chartData}
          selectedBenchmarks={selectedBenchmarks}
          onToggleBenchmark={toggleBenchmark}
          availBenchmarks={availBenchmarks}
          snaps={snaps}
          benchmarks={benchmarks}
          drawdownData={drawdownData}
          rollingData={rollingData}
          positions={positions}
        />

        <PositionPnlTable positions={positions} />

        <div className="glass-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
          >
            <h3 className="text-lg font-semibold">Advanced statistics</h3>
            {showAdvanced ? (
              <ChevronUp size={18} className="text-text-muted" />
            ) : (
              <ChevronDown size={18} className="text-text-muted" />
            )}
          </button>
          {showAdvanced && serverMetrics && <ServerMetricsStrip m={serverMetrics} />}
          {showAdvanced && <AdvancedStatsPanel snaps={snaps} benchmarks={benchmarks} />}
        </div>
      </div>
    </>
  );
}

export default function PerformanceInner() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-text-secondary">
          Loading…
        </div>
      }
    >
      <PerformanceContent />
    </Suspense>
  );
}
