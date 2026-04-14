'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/page-header';
import { getDocLibraryTier } from '@/lib/library-doc-tier';
import { getLibraryDocumentById } from '@/lib/queries';
import { renderDocumentMarkdownFromPayload } from '@/lib/render-document-from-payload';
import type { Doc } from '@/lib/types';
import {
  Layers,
  History,
  Activity,
  FileText,
  TrendingUp,
  Target,
} from 'lucide-react';
import type { MiniCalendarRunKind } from '@/components/library/MiniCalendar';
import type { Position, Thesis } from '@/lib/types';
import {
  buildSleeveStackSeries,
  thesisStackLabel,
  categoryStackLabel,
  tickerStackLabel,
  aggregateWeightByThesis,
  type SleeveStackMode,
} from '@/lib/portfolio-aggregates';
import { sortPmDocs } from './tabs/palette-and-format';
import AllocationsTab from './tabs/AllocationsTab';
import PositionsTab from './tabs/PositionsTab';
import PerformanceTab from './tabs/PerformanceTab';
import ThesesTab from './tabs/ThesesTab';
import PMAnalysisTab from './tabs/PMAnalysisTab';
import ActivityTab from './tabs/ActivityTab';

interface AllocationDatum {
  name: string;
  value: number;
}

type SummaryAllocationMode = 'ticker' | 'category' | 'thesis';

const MAX_PIE_SLICES = 14;

type PieSliceDatum = { name: string; value: number; tooltipExtra?: string };

function bucketAllocationsForPie(items: AllocationDatum[]): PieSliceDatum[] {
  const pos = items.filter((x) => x.value > 0.0001).sort((a, b) => b.value - a.value);
  if (pos.length <= MAX_PIE_SLICES) return pos.map(({ name, value }) => ({ name, value }));
  const head = pos.slice(0, MAX_PIE_SLICES - 1);
  const tail = pos.slice(MAX_PIE_SLICES - 1);
  const other = tail.reduce((s, x) => s + x.value, 0);
  const tooltipExtra = tail.map((t) => `${t.name}: ${t.value.toFixed(1)}%`).join(' · ');
  return [...head.map(({ name, value }) => ({ name, value })), { name: 'Other', value: other, tooltipExtra }];
}

type TabId = 'allocations' | 'performance' | 'theses' | 'positions' | 'pm_analysis' | 'activity';

const VALID_TABS: TabId[] = ['allocations', 'performance', 'theses', 'positions', 'pm_analysis', 'activity'];

function aggregateRunKindForPortfolioDocs(docsOnDate: Doc[]): MiniCalendarRunKind {
  let sawBaseline = false;
  let sawDelta = false;
  for (const d of docsOnDate) {
    const rt = (d.runType || '').toLowerCase();
    if (rt === 'baseline') sawBaseline = true;
    else if (rt === 'delta') sawDelta = true;
  }
  if (sawBaseline && sawDelta) return 'baseline';
  if (sawBaseline) return 'baseline';
  if (sawDelta) return 'delta';
  return 'unknown';
}

export default function PortfolioShellInner() {
  const { data, loading, error } = useDashboard();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<TabId>('allocations');
  const [summaryAllocationMode, setSummaryAllocationMode] = useState<SummaryAllocationMode>('ticker');
  const [historyMode, setHistoryMode] = useState<SleeveStackMode>('category');
  const [pmActiveFile, setPmActiveFile] = useState<Doc | null>(null);
  const [pmLibraryDoc, setPmLibraryDoc] = useState<Awaited<ReturnType<typeof getLibraryDocumentById>> | null>(null);
  const [pmLoading, setPmLoading] = useState(false);

  const positions = useMemo(() => data?.positions ?? [], [data]);
  const ratios = useMemo(() => data?.ratios ?? [], [data]);
  const metrics = data?.calculated;
  const theses = useMemo(() => data?.portfolio?.strategy?.theses ?? [], [data]);
  const positionHistory = useMemo(() => data?.position_history ?? [], [data]);
  const positionEvents = useMemo(() => data?.position_events ?? [], [data]);
  const lastUpdated = data?.portfolio?.meta?.last_updated ?? null;
  const holdingTechnicals = useMemo(() => data?.holding_technicals ?? {}, [data]);

  const thesisById = useMemo(() => new Map(theses.map((t) => [t.id, t])), [theses]);

  const pieData = useMemo<AllocationDatum[]>(() => {
    const slices: AllocationDatum[] = positions.map((p) => ({
      name: p.ticker,
      value: p.weight_actual ?? 0,
    }));
    ratios.forEach((r) =>
      slices.push({ name: `${r.long_ticker}/${r.short_ticker}`, value: r.net_weight ?? 0 })
    );
    if ((metrics?.cash_pct ?? 0) > 0) slices.push({ name: 'CASH', value: metrics?.cash_pct ?? 0 });
    return slices;
  }, [positions, ratios, metrics?.cash_pct]);

  const pieDataBucketed = useMemo(() => bucketAllocationsForPie(pieData), [pieData]);

  const categoryBarData = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of positions) {
      const key = p.ticker === 'CASH' ? 'cash' : p.category || 'uncategorized';
      m.set(key, (m.get(key) ?? 0) + (p.weight_actual ?? 0));
    }
    return [...m.entries()]
      .map(([key, value]) => ({
        key,
        name:
          key === 'cash'
            ? 'Cash'
            : key === 'uncategorized'
              ? 'Uncategorized'
              : key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [positions]);

  const byThesisWeight = useMemo(() => aggregateWeightByThesis(positions), [positions]);

  const thesisBookRows = useMemo(() => {
    const rows: {
      id: string;
      thesis: Thesis | null;
      weight: number;
    }[] = [];
    for (const t of theses) {
      rows.push({ id: t.id, thesis: t, weight: byThesisWeight.get(t.id) ?? 0 });
    }
    const unlinked = byThesisWeight.get('_unlinked') ?? 0;
    if (unlinked > 0.005) {
      rows.push({ id: '_unlinked', thesis: null, weight: unlinked });
    }
    return rows.sort((a, b) => b.weight - a.weight);
  }, [theses, byThesisWeight]);

  const thesisBarRich = useMemo(
    () =>
      thesisBookRows
        .filter((r) => r.weight > 0)
        .map((r) => ({
          name: r.id === '_unlinked' ? 'Unlinked' : r.thesis?.name ?? r.id,
          value: r.weight,
          status: r.thesis?.status ?? null,
        })),
    [thesisBookRows]
  );

  const activityEvents = useMemo(
    () => positionEvents.filter((ev) => ev.event !== 'HOLD'),
    [positionEvents]
  );

  const { data: sleeveData, keys: sleeveKeys } = useMemo(
    () => buildSleeveStackSeries(positionHistory, historyMode),
    [positionHistory, historyMode]
  );

  const formatSleeveKey = (k: string) => {
    if (historyMode === 'thesis') return thesisStackLabel(k, theses);
    if (historyMode === 'ticker') return tickerStackLabel(k);
    return categoryStackLabel(k);
  };

  const latestRunDocByKey = useMemo(() => {
    const m = new Map<string, boolean>();
    if (!lastUpdated || !data?.docs) return m;
    for (const d of data.docs) {
      if (d.date === lastUpdated) m.set(d.path, true);
    }
    return m;
  }, [data, lastUpdated]);

  const researchStripLinks = useMemo(() => {
    if (!lastUpdated) return [] as { label: string; docKey: string }[];
    const out: { label: string; docKey: string }[] = [];
    if (latestRunDocByKey.has('digest')) out.push({ label: 'Digest', docKey: 'digest' });
    const mte = `market-thesis-exploration/${lastUpdated}.json`;
    if (latestRunDocByKey.has(mte)) out.push({ label: 'Market thesis', docKey: mte });
    return out;
  }, [lastUpdated, latestRunDocByKey]);

  const pmStripLinks = useMemo(() => {
    if (!lastUpdated) return [] as { label: string; docKey: string }[];
    const candidates = [
      { label: 'PM memo', keys: [`pm-allocation-memo/${lastUpdated}.json`] as const },
      { label: 'Deliberation index', keys: [`deliberation-transcript-index/${lastUpdated}.json`] as const },
      { label: 'Vehicle map', keys: [`thesis-vehicle-map/${lastUpdated}.json`] as const },
      { label: 'Deliberation', keys: ['deliberation.md', 'deliberation.json'] as const },
      { label: 'Rebalance', keys: ['rebalance-decision.json'] as const },
    ];
    const out: { label: string; docKey: string }[] = [];
    for (const c of candidates) {
      const docKey = c.keys.find((k) => latestRunDocByKey.has(k));
      if (docKey) out.push({ label: c.label, docKey });
    }
    return out;
  }, [lastUpdated, latestRunDocByKey]);

  const pipe = data?.pipeline_observability ?? null;

  const processObsMarkdown = useMemo(() => {
    if (!pipe) {
      return { memo: null as string | null, vehicle: null as string | null, index: null as string | null };
    }
    return {
      memo: pipe.pm_allocation_memo ? renderDocumentMarkdownFromPayload(pipe.pm_allocation_memo) : null,
      vehicle: pipe.thesis_vehicle_map ? renderDocumentMarkdownFromPayload(pipe.thesis_vehicle_map) : null,
      index: pipe.deliberation_session_index ? renderDocumentMarkdownFromPayload(pipe.deliberation_session_index) : null,
    };
  }, [pipe]);

  const deliberationIndexRows = useMemo(() => {
    if (!pipe?.deliberation_session_index) {
      return [] as { ticker: string; document_key: string; converged: boolean | null; rounds: string }[];
    }
    const idx = pipe.deliberation_session_index;
    const body =
      typeof idx.body === 'object' && idx.body !== null && !Array.isArray(idx.body)
        ? (idx.body as Record<string, unknown>)
        : null;
    const raw = body?.entries;
    if (!Array.isArray(raw)) return [];
    const rows: { ticker: string; document_key: string; converged: boolean | null; rounds: string }[] = [];
    for (const e of raw) {
      if (!e || typeof e !== 'object' || Array.isArray(e)) continue;
      const o = e as Record<string, unknown>;
      rows.push({
        ticker: String(o.ticker || ''),
        document_key: String(o.document_key || ''),
        converged: typeof o.converged === 'boolean' ? o.converged : null,
        rounds: o.rounds_completed != null ? String(o.rounds_completed) : '—',
      });
    }
    return rows;
  }, [pipe]);

  const hasPipelineObservability =
    !!pipe &&
    Boolean(
      pipe.pm_allocation_memo ||
        pipe.thesis_vehicle_map ||
        pipe.deliberation_session_index ||
        pipe.asset_recommendations.length > 0 ||
        pipe.deliberation_transcripts.length > 0
    );

  const portfolioDocDates = useMemo(() => {
    const s = new Set<string>();
    for (const d of data?.docs ?? []) {
      if (d.date && getDocLibraryTier(d) === 'portfolio') s.add(d.date);
    }
    return s;
  }, [data?.docs]);

  const positionHistoryDates = useMemo(() => {
    const s = new Set<string>();
    for (const r of positionHistory) {
      if (r.date) s.add(r.date);
    }
    return s;
  }, [positionHistory]);

  const historyTimelineDates = useMemo(() => {
    const s = new Set<string>([...portfolioDocDates, ...positionHistoryDates]);
    return [...s].sort().reverse();
  }, [portfolioDocDates, positionHistoryDates]);

  const historyDateSet = useMemo(() => new Set(historyTimelineDates), [historyTimelineDates]);

  const defaultHistoryDate = useMemo(() => {
    if (lastUpdated && historyDateSet.has(lastUpdated)) return lastUpdated;
    return historyTimelineDates[0] ?? null;
  }, [lastUpdated, historyDateSet, historyTimelineDates]);

  const dateParam = searchParams.get('date');

  const effHistoryDate = useMemo(() => {
    if (dateParam && historyDateSet.has(dateParam)) return dateParam;
    return defaultHistoryDate;
  }, [dateParam, historyDateSet, defaultHistoryDate]);

  const thesisPositionsForHistoryDate = useMemo((): Pick<Position, 'weight_actual' | 'thesis_ids'>[] => {
    if (!effHistoryDate) return [];
    return positionHistory
      .filter((r) => r.date === effHistoryDate)
      .map((r) => ({
        weight_actual: r.weight_pct,
        thesis_ids: r.thesis_id ? [r.thesis_id] : [],
      }));
  }, [effHistoryDate, positionHistory]);

  const byThesisWeightForHistoryDate = useMemo(
    () => aggregateWeightByThesis(thesisPositionsForHistoryDate),
    [thesisPositionsForHistoryDate]
  );

  const thesisBookRowsForHistoryDate = useMemo(() => {
    const rows: { id: string; thesis: Thesis | null; weight: number }[] = [];
    for (const t of theses) {
      rows.push({ id: t.id, thesis: t, weight: byThesisWeightForHistoryDate.get(t.id) ?? 0 });
    }
    const unlinked = byThesisWeightForHistoryDate.get('_unlinked') ?? 0;
    if (unlinked > 0.005) {
      rows.push({ id: '_unlinked', thesis: null, weight: unlinked });
    }
    return rows.sort((a, b) => b.weight - a.weight);
  }, [theses, byThesisWeightForHistoryDate]);

  const thesisBarForChartForHistoryDate = useMemo(
    () =>
      thesisBookRowsForHistoryDate
        .filter((r) => r.weight > 0)
        .map((r) => ({
          name: r.id === '_unlinked' ? 'Unlinked' : r.thesis?.name ?? r.id,
          value: r.weight,
        })),
    [thesisBookRowsForHistoryDate]
  );

  const researchDocKeysOnHistoryDate = useMemo(() => {
    const m = new Map<string, boolean>();
    const docs = data?.docs;
    if (!effHistoryDate || !docs) return m;
    for (const d of docs) {
      if (d.date === effHistoryDate) m.set(d.path, true);
    }
    return m;
  }, [data, effHistoryDate]);

  const researchStripLinksForHistoryDate = useMemo(() => {
    if (!effHistoryDate) return [] as { label: string; docKey: string }[];
    const out: { label: string; docKey: string }[] = [];
    if (researchDocKeysOnHistoryDate.has('digest')) out.push({ label: 'Digest', docKey: 'digest' });
    const mte = `market-thesis-exploration/${effHistoryDate}.json`;
    if (researchDocKeysOnHistoryDate.has(mte)) out.push({ label: 'Market thesis', docKey: mte });
    return out;
  }, [effHistoryDate, researchDocKeysOnHistoryDate]);

  const portfolioHistoryRunKindByDate = useMemo(() => {
    const m = new Map<string, MiniCalendarRunKind>();
    const docs = data?.docs ?? [];
    const snapshotRunTypeByDate = data?.snapshot_run_type_by_date ?? {};
    for (const date of historyTimelineDates) {
      const onDay = docs.filter((d) => d.date === date && getDocLibraryTier(d) === 'portfolio');
      let kind = aggregateRunKindForPortfolioDocs(onDay);
      if (kind === 'unknown') {
        const snap = snapshotRunTypeByDate[date];
        if (snap === 'baseline' || snap === 'delta') kind = snap;
      }
      m.set(date, kind);
    }
    return m;
  }, [data?.docs, data?.snapshot_run_type_by_date, historyTimelineDates]);

  const docsForPm = data?.docs;
  const pmDocsForHistory = useMemo(() => {
    if (!effHistoryDate || !docsForPm) return [];
    return sortPmDocs(
      docsForPm.filter((d) => d.date === effHistoryDate && getDocLibraryTier(d) === 'portfolio')
    );
  }, [docsForPm, effHistoryDate]);

  const historyLatestDate = historyTimelineDates[0] ?? null;
  const showHistoryDateBanner = Boolean(
    dateParam && historyDateSet.has(dateParam) && defaultHistoryDate && dateParam !== defaultHistoryDate
  );

  useEffect(() => {
    const raw = searchParams.get('tab');
    if (!raw) return;
    if (VALID_TABS.includes(raw as TabId)) return;
    if (raw !== 'summary' && raw !== 'history' && raw !== 'pm_process' && raw !== 'thesis') return;

    const p = new URLSearchParams(searchParams.toString());
    if (raw === 'summary') {
      p.delete('tab');
      p.delete('docKey');
      p.delete('date');
      p.delete('thesis');
    } else if (raw === 'history') {
      p.set('tab', searchParams.get('thesis') ? 'theses' : 'pm_analysis');
      if (!p.get('date') && defaultHistoryDate) p.set('date', defaultHistoryDate);
    } else if (raw === 'pm_process') {
      p.set('tab', 'pm_analysis');
      if (!p.get('date') && data?.docs && lastUpdated) {
        const dk = p.get('docKey');
        if (dk) {
          const matches = data.docs
            .filter((d) => d.path === dk && getDocLibraryTier(d) === 'portfolio')
            .sort((a, b) => b.date.localeCompare(a.date));
          p.set('date', matches[0]?.date ?? lastUpdated);
        } else {
          p.set('date', lastUpdated);
        }
      }
    } else if (raw === 'thesis') {
      p.set('tab', 'theses');
      if (!p.get('date') && defaultHistoryDate) p.set('date', defaultHistoryDate);
    }
    const target = p.toString();
    router.replace(target ? `${pathname}?${target}` : pathname, { scroll: false });
  }, [searchParams, pathname, router, data?.docs, lastUpdated, defaultHistoryDate]);

  useEffect(() => {
    const raw = searchParams.get('tab');
    let mapped: TabId = 'allocations';
    if (!raw || raw === 'summary') mapped = 'allocations';
    else if (raw === 'history') mapped = searchParams.get('thesis') ? 'theses' : 'pm_analysis';
    else if (raw === 'pm_process') mapped = 'pm_analysis';
    else if (raw === 'thesis') mapped = 'theses';
    else if (VALID_TABS.includes(raw as TabId)) mapped = raw as TabId;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync tab from URL
    setTab(mapped);
  }, [searchParams]);

  const docKeyParam = searchParams.get('docKey');

  useEffect(() => {
    if (!effHistoryDate || !data?.docs) return;
    if (searchParams.get('tab') !== 'pm_analysis') return;
    if (!docKeyParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync PM doc viewer from URL
      setPmActiveFile(null);
      setPmLibraryDoc(null);
      return;
    }
    const doc = data.docs.find(
      (d) => d.date === effHistoryDate && d.path === docKeyParam && getDocLibraryTier(d) === 'portfolio'
    );
    if (!doc) {
      setPmActiveFile(null);
      setPmLibraryDoc(null);
      return;
    }
    setPmActiveFile(doc);
    setPmLoading(true);
    setPmLibraryDoc(null);
    getLibraryDocumentById(doc.id)
      .then(setPmLibraryDoc)
      .catch(() =>
        setPmLibraryDoc({
          id: doc.id,
          date: doc.date,
          document_key: doc.path,
          view: 'markdown',
          markdown: '_Failed to load document._',
          payload: null,
        })
      )
      .finally(() => setPmLoading(false));
  }, [docKeyParam, effHistoryDate, data?.docs, searchParams]);

  function navigateTab(next: TabId) {
    setTab(next);
    if (next !== 'pm_analysis') {
      setPmActiveFile(null);
      setPmLibraryDoc(null);
    }
    const p = new URLSearchParams(searchParams.toString());
    if (next === 'allocations') {
      p.delete('tab');
      p.delete('docKey');
      p.delete('date');
      p.delete('thesis');
    } else {
      p.set('tab', next);
      if (next !== 'theses' && next !== 'pm_analysis') {
        p.delete('docKey');
        p.delete('date');
        p.delete('thesis');
      } else {
        if (!p.get('date') && defaultHistoryDate) p.set('date', defaultHistoryDate);
        if (next === 'theses') {
          p.delete('docKey');
        }
        if (next === 'pm_analysis') {
          p.delete('thesis');
        }
      }
    }
    const s = p.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }

  function openPmDocument(doc: Doc) {
    setTab('pm_analysis');
    const p = new URLSearchParams(searchParams.toString());
    p.set('tab', 'pm_analysis');
    p.set('date', doc.date);
    p.set('docKey', doc.path);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  function closePmDocument() {
    setPmActiveFile(null);
    setPmLibraryDoc(null);
    const p = new URLSearchParams(searchParams.toString());
    p.delete('docKey');
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  function selectPortfolioDate(iso: string, target: 'theses' | 'pm_analysis') {
    if (!historyDateSet.has(iso)) return;
    const p = new URLSearchParams(searchParams.toString());
    p.set('tab', target);
    p.set('date', iso);
    p.delete('docKey');
    if (target === 'theses') {
      setPmActiveFile(null);
      setPmLibraryDoc(null);
    }
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  function clearHistoryDateParam() {
    const p = new URLSearchParams(searchParams.toString());
    p.delete('date');
    p.delete('docKey');
    p.set('tab', tab);
    setPmActiveFile(null);
    setPmLibraryDoc(null);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  const thesisHref = useCallback(
    (thesisId: string) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set('tab', 'theses');
      p.set('thesis', thesisId);
      if (!p.get('date') && defaultHistoryDate) p.set('date', defaultHistoryDate);
      return `${pathname}?${p.toString()}`;
    },
    [searchParams, pathname, defaultHistoryDate]
  );

  const clearThesisHref = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete('thesis');
    const s = p.toString();
    return s ? `${pathname}?${s}` : pathname;
  }, [searchParams, pathname]);

  const highlightThesisParam = searchParams.get('thesis');

  const tabs: { id: TabId; label: string; icon: typeof Layers }[] = [
    { id: 'allocations', label: 'Allocations', icon: Layers },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'theses', label: 'Theses', icon: History },
    { id: 'positions', label: 'Positions', icon: Target },
    { id: 'pm_analysis', label: 'PM analysis', icon: FileText },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

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

  return (
    <>
      <PageHeader title="Portfolio" />
      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-6 max-md:p-4">
        <div className="flex flex-wrap gap-2 border-b border-border-subtle pb-3">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => navigateTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === id
                  ? 'bg-fin-blue/15 text-fin-blue border border-fin-blue/40'
                  : 'text-text-secondary border border-transparent hover:bg-white/[0.04] hover:text-text-primary'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'allocations' && (
          <AllocationsTab
            lastUpdated={lastUpdated}
            researchStripLinks={researchStripLinks}
            pmStripLinks={pmStripLinks}
            hasPipelineObservability={hasPipelineObservability}
            pipe={pipe}
            processObsMarkdown={processObsMarkdown}
            deliberationIndexRows={deliberationIndexRows}
            summaryAllocationMode={summaryAllocationMode}
            setSummaryAllocationMode={setSummaryAllocationMode}
            pieDataBucketed={pieDataBucketed}
            categoryBarData={categoryBarData}
            thesisBarRich={thesisBarRich}
          />
        )}

        {tab === 'positions' && (
          <PositionsTab
            positions={positions}
            thesisById={thesisById}
            holdingTechnicals={holdingTechnicals}
            lastUpdated={lastUpdated}
          />
        )}

        {tab === 'performance' && <PerformanceTab />}

        {tab === 'theses' && (
          <ThesesTab
            historyTimelineDates={historyTimelineDates}
            portfolioHistoryRunKindByDate={portfolioHistoryRunKindByDate}
            effHistoryDate={effHistoryDate}
            onSelectHistoryDate={(iso) => selectPortfolioDate(iso, 'theses')}
            historyLatestDate={historyLatestDate}
            onClearHistoryDate={clearHistoryDateParam}
            highlightThesisParam={highlightThesisParam}
            thesisHref={thesisHref}
            clearThesisHref={clearThesisHref}
            historyMode={historyMode}
            setHistoryMode={setHistoryMode}
            sleeveData={sleeveData}
            sleeveKeys={sleeveKeys}
            formatSleeveKey={formatSleeveKey}
            showHistoryDateBanner={showHistoryDateBanner}
            dateParam={dateParam}
            thesisBarForChartForHistoryDate={thesisBarForChartForHistoryDate}
            thesisBookRowsForHistoryDate={thesisBookRowsForHistoryDate}
            researchStripLinksForHistoryDate={researchStripLinksForHistoryDate}
            lastUpdated={lastUpdated}
          />
        )}

        {tab === 'pm_analysis' && (
          <PMAnalysisTab
            historyTimelineDates={historyTimelineDates}
            portfolioHistoryRunKindByDate={portfolioHistoryRunKindByDate}
            effHistoryDate={effHistoryDate}
            onSelectHistoryDate={(iso) => selectPortfolioDate(iso, 'pm_analysis')}
            historyLatestDate={historyLatestDate}
            onClearHistoryDate={clearHistoryDateParam}
            pmDocsForHistory={pmDocsForHistory}
            portfolioDocDates={portfolioDocDates}
            positionHistoryDates={positionHistoryDates}
            pmActiveFile={pmActiveFile}
            pmLibraryDoc={pmLibraryDoc}
            pmLoading={pmLoading}
            onOpenPmDocument={openPmDocument}
            onClosePmDocument={closePmDocument}
          />
        )}

        {tab === 'activity' && <ActivityTab activityEvents={activityEvents} thesisById={thesisById} />}
      </div>
    </>
  );
}
