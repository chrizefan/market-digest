'use client';

import { Fragment, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDashboard } from '@/lib/dashboard-context';
import PageHeader from '@/components/page-header';
import LibraryDocumentBody from '@/components/library/LibraryDocumentBody';
import { Badge, SectionTitle, formatPct, pnlColor } from '@/components/ui';
import { getDocLibraryTier } from '@/lib/library-doc-tier';
import { getLibraryDocumentById } from '@/lib/queries';
import { renderDocumentMarkdownFromPayload } from '@/lib/render-document-from-payload';
import type { Doc } from '@/lib/types';
import {
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  History,
  Activity,
  FileText,
  X,
  Calendar,
} from 'lucide-react';
import MiniCalendar, { type MiniCalendarRunKind } from '@/components/library/MiniCalendar';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { Position, Thesis, DashboardPositionEvent } from '@/lib/types';
import { SleeveStackedChart } from '@/components/portfolio/sleeve-stacked-chart';
import StrategyThesisPanel from '@/components/portfolio/StrategyThesisPanel';
import {
  buildSleeveStackSeries,
  thesisStackLabel,
  categoryStackLabel,
  tickerStackLabel,
  aggregateWeightByThesis,
  type SleeveStackMode,
} from '@/lib/portfolio-aggregates';

const PALETTE = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#F97316',
  '#EC4899',
  '#6366F1',
  '#14B8A6',
];

const CATEGORY_LABELS: Record<string, string> = {
  commodity_gold: 'Commodity — Gold',
  commodity_oil: 'Commodity — Oil',
  commodity_silver: 'Commodity — Silver',
  equity_sector: 'Equity Sector',
  equity_broad: 'Broad Equity',
  fixed_income_cash: 'Cash',
  fixed_income_short: 'Short Duration',
  fixed_income_long: 'Long Duration',
  fixed_income_tips: 'TIPS',
  crypto: 'Crypto',
  international: 'International',
  cash: 'Cash',
  uncategorized: 'Uncategorized',
};

function formatCategory(cat: string | null | undefined): string {
  if (!cat) return '—';
  return CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

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

type TabId = 'summary' | 'history' | 'activity';

const PM_DOC_ORDER = [
  'deliberation.md',
  'deliberation.json',
  'deliberation-transcript.json',
  'rebalance-decision.json',
  'portfolio-recommendation.json',
  'opportunity-screener.json',
] as const;

function pmDocSortKey(path: string): number {
  const low = path.toLowerCase();
  if (low.startsWith('pm-allocation-memo/')) return 0;
  if (low.includes('deliberation-transcript-index/')) return 1;
  if (low.startsWith('deliberation-transcript/')) return 2;
  if (low.startsWith('asset-recommendations/')) return 3;
  if (low.startsWith('thesis-vehicle-map/')) return 4;
  if (low.startsWith('market-thesis-exploration/')) return 5;
  const file = low.split('/').pop() || low;
  const i = (PM_DOC_ORDER as readonly string[]).indexOf(file);
  return i === -1 ? 50 : 10 + i;
}

function sortPmDocs(docs: Doc[]): Doc[] {
  return [...docs].sort((a, b) => {
    const ka = pmDocSortKey(a.path);
    const kb = pmDocSortKey(b.path);
    if (ka !== kb) return ka - kb;
    return a.path.localeCompare(b.path);
  });
}

function eventBadgeVariant(
  ev: DashboardPositionEvent['event']
): 'green' | 'red' | 'amber' | 'default' {
  if (ev === 'OPEN') return 'green';
  if (ev === 'EXIT') return 'red';
  if (ev === 'REBALANCE') return 'amber';
  return 'default';
}

function thesisNames(ids: string[], thesisById: Map<string, Thesis>): string {
  if (!ids.length) return '—';
  return ids
    .map((id) => thesisById.get(id)?.name ?? id)
    .join(', ');
}

const VALID_TABS: TabId[] = ['summary', 'history', 'activity'];

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

function PortfolioPageContent() {
  const { data, loading, error } = useDashboard();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [expandedThesisId, setExpandedThesisId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('summary');
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
        name: formatCategory(key === 'cash' ? 'cash' : key === 'uncategorized' ? 'uncategorized' : key),
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

  const thesisBarForChart = useMemo(
    () =>
      thesisBookRows
        .filter((r) => r.weight > 0)
        .map((r) => ({
          name:
            r.id === '_unlinked'
              ? 'Unlinked'
              : r.thesis?.name ?? r.id,
          value: r.weight,
        })),
    [thesisBookRows]
  );

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

  const thesisPositionsForHistoryDate = useMemo((): Pick<
    Position,
    'weight_actual' | 'thesis_ids'
  >[] => {
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
  const showHistoryDateBanner =
    Boolean(dateParam && historyDateSet.has(dateParam) && defaultHistoryDate && dateParam !== defaultHistoryDate);

  useEffect(() => {
    const rawTab = searchParams.get('tab');
    if (rawTab !== 'pm_process' && rawTab !== 'thesis') return;
    const p = new URLSearchParams(searchParams.toString());
    p.set('tab', 'history');
    if (rawTab === 'pm_process') {
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
    } else if (rawTab === 'thesis' && !p.get('date') && defaultHistoryDate) {
      p.set('date', defaultHistoryDate);
    }
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }, [searchParams, pathname, router, data?.docs, lastUpdated, defaultHistoryDate]);

  useEffect(() => {
    const raw = searchParams.get('tab');
    const mapped = raw === 'pm_process' || raw === 'thesis' ? 'history' : raw;
    const t = mapped as TabId | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync tab from URL
    if (t && VALID_TABS.includes(t)) setTab(t);
  }, [searchParams]);

  const docKeyParam = searchParams.get('docKey');

  useEffect(() => {
    if (!effHistoryDate || !data?.docs) return;
    if (searchParams.get('tab') !== 'history') return;
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
    setPmActiveFile(null);
    setPmLibraryDoc(null);
    const p = new URLSearchParams(searchParams.toString());
    if (next === 'summary') {
      p.delete('tab');
      p.delete('docKey');
      p.delete('date');
    } else {
      p.set('tab', next);
      if (next !== 'history') {
        p.delete('docKey');
        p.delete('date');
      } else if (!p.get('date') && defaultHistoryDate) {
        p.set('date', defaultHistoryDate);
      }
    }
    const s = p.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }

  function openPmDocument(doc: Doc) {
    setTab('history');
    const p = new URLSearchParams(searchParams.toString());
    p.set('tab', 'history');
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

  function selectHistoryDate(iso: string) {
    if (!historyDateSet.has(iso)) return;
    const p = new URLSearchParams(searchParams.toString());
    p.set('tab', 'history');
    p.set('date', iso);
    p.delete('docKey');
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  function clearHistoryDateParam() {
    const p = new URLSearchParams(searchParams.toString());
    p.delete('date');
    p.delete('docKey');
    setPmActiveFile(null);
    setPmLibraryDoc(null);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  const thesisHref = useCallback(
    (thesisId: string) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set('tab', 'history');
      p.set('thesis', thesisId);
      return `${pathname}?${p.toString()}`;
    },
    [searchParams, pathname]
  );

  const clearThesisHref = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete('thesis');
    const s = p.toString();
    return s ? `${pathname}?${s}` : pathname;
  }, [searchParams, pathname]);

  const highlightThesisParam = searchParams.get('thesis');

  const tabs: { id: TabId; label: string; icon: typeof Layers }[] = [
    { id: 'summary', label: 'Summary', icon: Layers },
    { id: 'history', label: 'Analysis', icon: History },
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
      <PageHeader title="Asset Allocation" />
      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-6 max-md:p-4">
        {/* Tabs */}
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

        {tab === 'summary' && (
          <>
            {(researchStripLinks.length > 0 || pmStripLinks.length > 0) && (
              <div className="glass-card px-5 py-4 space-y-3">
                {researchStripLinks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs text-text-muted uppercase tracking-wider">Research</span>
                    <div className="flex flex-wrap gap-2">
                      {researchStripLinks.map((l) => (
                        <Link
                          key={l.docKey}
                          href={`/library?date=${encodeURIComponent(String(lastUpdated))}&docKey=${encodeURIComponent(l.docKey)}`}
                          className="text-xs px-3 py-1.5 rounded-md bg-fin-blue/10 text-fin-blue hover:bg-fin-blue/20 transition-colors"
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {pmStripLinks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs text-text-muted uppercase tracking-wider">PM &amp; process</span>
                    <div className="flex flex-wrap gap-2">
                      {pmStripLinks.map((l) => (
                        <Link
                          key={l.docKey}
                          href={`/portfolio?tab=history&date=${encodeURIComponent(String(lastUpdated))}&docKey=${encodeURIComponent(l.docKey)}`}
                          className="text-xs px-3 py-1.5 rounded-md bg-fin-amber/10 text-fin-amber hover:bg-fin-amber/20 transition-colors"
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                <span className="text-xs text-text-muted block">as of {lastUpdated}</span>
              </div>
            )}

            {hasPipelineObservability && lastUpdated && pipe?.snapshot_date === lastUpdated ? (
              <div className="glass-card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border-subtle bg-bg-secondary">
                  <h3 className="text-sm font-semibold">Pipeline observability</h3>
                  <p className="text-xs text-text-muted mt-1">
                    Thesis → vehicles → analyst → deliberation → PM memo, rendered from published JSON for{' '}
                    <span className="font-mono text-text-secondary">{pipe.snapshot_date}</span>.
                  </p>
                </div>
                <div className="p-5 space-y-6">
                  {processObsMarkdown.memo ? (
                    <details open className="group">
                      <summary className="cursor-pointer text-sm font-semibold text-text-primary list-none flex items-center gap-2">
                        <ChevronDown
                          size={16}
                          className="text-text-muted shrink-0 transition-transform group-open:rotate-180"
                          aria-hidden
                        />
                        PM allocation memo
                      </summary>
                      <div className="mt-3 prose prose-invert max-w-none text-sm leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{processObsMarkdown.memo}</ReactMarkdown>
                      </div>
                    </details>
                  ) : null}
                  {processObsMarkdown.vehicle ? (
                    <details open className="group border-t border-border-subtle/80 pt-5">
                      <summary className="cursor-pointer text-sm font-semibold text-text-primary list-none flex items-center gap-2">
                        <ChevronDown
                          size={16}
                          className="text-text-muted shrink-0 transition-transform group-open:rotate-180"
                          aria-hidden
                        />
                        Thesis → vehicle map
                      </summary>
                      <div className="mt-3 prose prose-invert max-w-none text-sm leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{processObsMarkdown.vehicle}</ReactMarkdown>
                      </div>
                    </details>
                  ) : null}
                  {processObsMarkdown.index ? (
                    <details open className="group border-t border-border-subtle/80 pt-5">
                      <summary className="cursor-pointer text-sm font-semibold text-text-primary list-none flex items-center gap-2">
                        <ChevronDown
                          size={16}
                          className="text-text-muted shrink-0 transition-transform group-open:rotate-180"
                          aria-hidden
                        />
                        Deliberation session index
                      </summary>
                      <div className="mt-3 prose prose-invert max-w-none text-sm leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{processObsMarkdown.index}</ReactMarkdown>
                      </div>
                    </details>
                  ) : null}
                  {deliberationIndexRows.length > 0 ? (
                    <div className="border-t border-border-subtle/80 pt-5">
                      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                        Open a per-ticker transcript
                      </h4>
                      <div className="overflow-x-auto rounded-lg border border-border-subtle">
                        <table className="w-full text-sm min-w-[520px]">
                          <thead>
                            <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border-subtle bg-bg-secondary/50">
                              <th className="text-left px-3 py-2">Ticker</th>
                              <th className="text-left px-3 py-2">Converged</th>
                              <th className="text-right px-3 py-2">Rounds</th>
                              <th className="text-left px-3 py-2">Transcript</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle">
                            {deliberationIndexRows.map((row) => (
                              <tr key={row.document_key || row.ticker}>
                                <td className="px-3 py-2 font-mono font-medium">{row.ticker || '—'}</td>
                                <td className="px-3 py-2 text-text-secondary">
                                  {row.converged === true ? 'Yes' : row.converged === false ? 'No' : '—'}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-text-secondary">{row.rounds}</td>
                                <td className="px-3 py-2">
                                  {row.document_key ? (
                                    <Link
                                      href={`/portfolio?tab=history&date=${encodeURIComponent(lastUpdated)}&docKey=${encodeURIComponent(row.document_key)}`}
                                      className="text-fin-amber text-xs hover:underline"
                                    >
                                      Open in History
                                    </Link>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                  {pipe.asset_recommendations.length > 0 ? (
                    <div className="border-t border-border-subtle/80 pt-5 space-y-2">
                      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Analyst reports (by ticker)
                      </h4>
                      <div className="space-y-2">
                        {pipe.asset_recommendations.map((doc) => {
                          const md = renderDocumentMarkdownFromPayload(doc.payload);
                          if (!md) return null;
                          return (
                            <details key={doc.document_key} className="group rounded-lg border border-border-subtle bg-bg-secondary/30">
                              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold font-mono list-none flex items-center gap-2">
                                <ChevronDown
                                  size={16}
                                  className="text-text-muted shrink-0 transition-transform group-open:rotate-180"
                                  aria-hidden
                                />
                                {doc.ticker}
                              </summary>
                              <div className="px-4 pb-4 prose prose-invert max-w-none text-sm leading-relaxed border-t border-border-subtle/60 pt-3">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
                                <Link
                                  href={`/portfolio?tab=history&date=${encodeURIComponent(lastUpdated)}&docKey=${encodeURIComponent(doc.document_key)}`}
                                  className="inline-block mt-3 text-xs text-fin-amber hover:underline not-prose"
                                >
                                  Open raw document in History
                                </Link>
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                  {pipe.deliberation_transcripts.length > 0 ? (
                    <div className="border-t border-border-subtle/80 pt-5 space-y-2">
                      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Deliberation transcripts (by ticker)
                      </h4>
                      <div className="space-y-2">
                        {pipe.deliberation_transcripts.map((doc) => {
                          const md = renderDocumentMarkdownFromPayload(doc.payload);
                          if (!md) return null;
                          return (
                            <details key={doc.document_key} className="group rounded-lg border border-border-subtle bg-bg-secondary/30">
                              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold font-mono list-none flex items-center gap-2">
                                <ChevronDown
                                  size={16}
                                  className="text-text-muted shrink-0 transition-transform group-open:rotate-180"
                                  aria-hidden
                                />
                                {doc.ticker}
                              </summary>
                              <div className="px-4 pb-4 prose prose-invert max-w-none text-sm leading-relaxed border-t border-border-subtle/60 pt-3">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
                                <Link
                                  href={`/portfolio?tab=history&date=${encodeURIComponent(lastUpdated)}&docKey=${encodeURIComponent(doc.document_key)}`}
                                  className="inline-block mt-3 text-xs text-fin-amber hover:underline not-prose"
                                >
                                  Open structured view in History
                                </Link>
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="glass-card p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionTitle className="mb-0">Current allocation</SectionTitle>
                <div className="flex rounded-lg border border-border-subtle overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setSummaryAllocationMode('ticker')}
                    className={`px-3 py-1.5 font-medium ${summaryAllocationMode === 'ticker' ? 'bg-fin-blue/20 text-fin-blue' : 'text-text-muted hover:bg-white/[0.04]'}`}
                  >
                    Ticker
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryAllocationMode('category')}
                    className={`px-3 py-1.5 font-medium border-l border-border-subtle ${summaryAllocationMode === 'category' ? 'bg-fin-blue/20 text-fin-blue' : 'text-text-muted hover:bg-white/[0.04]'}`}
                  >
                    Category
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryAllocationMode('thesis')}
                    className={`px-3 py-1.5 font-medium border-l border-border-subtle ${summaryAllocationMode === 'thesis' ? 'bg-fin-blue/20 text-fin-blue' : 'text-text-muted hover:bg-white/[0.04]'}`}
                  >
                    Thesis
                  </button>
                </div>
              </div>
              <div className="h-[320px]">
                {summaryAllocationMode === 'ticker' &&
                  (pieDataBucketed.length === 0 ? (
                    <p className="text-text-muted text-sm py-12 text-center">No positions</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieDataBucketed}
                          cx="50%"
                          cy="50%"
                          innerRadius="55%"
                          outerRadius="80%"
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieDataBucketed.map((_, i) => (
                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const p = payload[0].payload as PieSliceDatum;
                            return (
                              <div className="rounded-lg border border-border-subtle bg-[#141414] px-3 py-2 text-xs shadow-lg max-w-xs">
                                <p className="font-medium text-text-primary">{p.name}</p>
                                <p className="text-text-secondary tabular-nums">{p.value.toFixed(1)}%</p>
                                {p.tooltipExtra ? (
                                  <p className="text-text-muted mt-1.5 text-[11px] leading-snug">{p.tooltipExtra}</p>
                                ) : null}
                              </div>
                            );
                          }}
                        />
                        <Legend
                          verticalAlign="middle"
                          align="right"
                          layout="vertical"
                          iconType="circle"
                          iconSize={8}
                          formatter={(val: string) => (
                            <span className="text-text-secondary text-xs ml-1">{val}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ))}
                {summaryAllocationMode === 'category' &&
                  (categoryBarData.length === 0 ? (
                    <p className="text-text-muted text-sm py-12 text-center">No positions</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={categoryBarData}
                        margin={{ left: 4, right: 16, top: 8, bottom: 8 }}
                      >
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis
                          type="number"
                          domain={[0, 'auto']}
                          tick={{ fill: '#71717a', fontSize: 11 }}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={120}
                          tick={{ fill: '#a1a1aa', fontSize: 11 }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const row = payload[0].payload as { name: string; value: number };
                            return (
                              <div className="rounded-lg border border-border-subtle bg-[#141414] px-3 py-2 text-xs shadow-lg">
                                <p className="font-medium text-text-primary">{row.name}</p>
                                <p className="text-text-secondary tabular-nums">{Number(row.value).toFixed(1)}% weight</p>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Weight %" />
                      </BarChart>
                    </ResponsiveContainer>
                  ))}
                {summaryAllocationMode === 'thesis' &&
                  (thesisBarRich.length === 0 ? (
                    <p className="text-text-muted text-sm py-12 text-center">No thesis-linked weights</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={thesisBarRich}
                        margin={{ left: 4, right: 16, top: 8, bottom: 8 }}
                      >
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis
                          type="number"
                          domain={[0, 'auto']}
                          tick={{ fill: '#71717a', fontSize: 11 }}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={140}
                          tick={{ fill: '#a1a1aa', fontSize: 10 }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const row = payload[0].payload as {
                              name: string;
                              value: number;
                              status: string | null;
                            };
                            return (
                              <div className="rounded-lg border border-border-subtle bg-[#141414] px-3 py-2 text-xs shadow-lg max-w-xs">
                                <p className="font-medium text-text-primary">{row.name}</p>
                                <p className="text-text-secondary tabular-nums">{Number(row.value).toFixed(1)}% weight</p>
                                {row.status ? (
                                  <p className="text-text-muted mt-1 text-[11px]">Status: {row.status}</p>
                                ) : null}
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ))}
              </div>
            </div>

            <div className="glass-card p-0 overflow-hidden">
              <div className="px-6 py-5 border-b border-border-subtle bg-bg-secondary">
                <h3 className="text-lg font-semibold">Positions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1040px]">
                  <thead>
                    <tr className="text-text-muted text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3">Ticker</th>
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-right px-4 py-3">Weight</th>
                      <th className="text-right px-4 py-3">Δ</th>
                      <th className="text-right px-4 py-3">Day</th>
                      <th className="text-right px-4 py-3">P&amp;L</th>
                      <th className="text-right px-4 py-3">Contrib</th>
                      <th className="text-right px-4 py-3" title="RSI(14) from price_technicals">
                        RSI
                      </th>
                      <th className="text-right px-4 py-3" title="% vs SMA50">
                        vs50
                      </th>
                      <th className="text-left px-4 py-3">Category</th>
                      <th className="text-left px-4 py-3">Thesis</th>
                      <th className="text-right px-4 py-3">Entry</th>
                      <th className="text-right px-4 py-3">Current</th>
                      <th className="px-4 py-3 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {positions.map((p: Position, i: number) => {
                      const isExpanded = expandedRow === i;
                      const pnlPct =
                        p.unrealized_pnl_pct != null && !Number.isNaN(p.unrealized_pnl_pct)
                          ? p.unrealized_pnl_pct
                          : p.entry_price && p.current_price && p.entry_price > 0
                            ? ((p.current_price - p.entry_price) / p.entry_price) * 100
                            : null;
                      const tech = holdingTechnicals[p.ticker];
                      return (
                        <Fragment key={p.ticker + String(i)}>
                          <tr
                            onClick={() => setExpandedRow(isExpanded ? null : i)}
                            className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${isExpanded ? 'bg-white/[0.02]' : ''}`}
                          >
                            <td className="px-4 py-3">
                              <Badge variant="blue">{p.ticker}</Badge>
                            </td>
                            <td className="px-4 py-3 max-w-[140px] truncate">{p.name}</td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                              {p.weight_actual?.toFixed(1)}%
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-mono tabular-nums text-xs ${typeof p.weight_delta === 'number' ? pnlColor(p.weight_delta) : 'text-text-muted'}`}
                            >
                              {typeof p.weight_delta === 'number'
                                ? `${p.weight_delta > 0 ? '+' : ''}${p.weight_delta.toFixed(1)}pp`
                                : '—'}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-mono tabular-nums text-xs ${pnlColor(p.day_change_pct)}`}
                            >
                              {p.day_change_pct != null ? formatPct(p.day_change_pct) : '—'}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-mono tabular-nums font-semibold text-xs ${pnlPct != null ? pnlColor(pnlPct) : ''}`}
                            >
                              {pnlPct != null ? formatPct(pnlPct) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-text-secondary">
                              {p.contribution_pct != null ? formatPct(p.contribution_pct) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-text-secondary">
                              {tech?.rsi_14 != null && !Number.isNaN(tech.rsi_14) ? tech.rsi_14.toFixed(1) : '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-text-secondary">
                              {tech?.pct_vs_sma50 != null && !Number.isNaN(tech.pct_vs_sma50)
                                ? formatPct(tech.pct_vs_sma50)
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-text-secondary text-xs">
                              {formatCategory(p.category)}
                            </td>
                            <td className="px-4 py-3 text-xs text-text-secondary max-w-[160px]">
                              {thesisNames(p.thesis_ids, thesisById)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums text-text-secondary text-xs">
                              {p.entry_price ? `$${p.entry_price.toFixed(2)}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums text-xs">
                              {p.current_price ? `$${p.current_price.toFixed(2)}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-text-muted">
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-white/[0.02]">
                              <td colSpan={14} className="px-6 py-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="flex items-center gap-2 text-base font-semibold mb-2">
                                      <Info size={16} className="text-fin-blue" /> Investment thesis
                                    </h4>
                                    <p className="text-text-muted leading-relaxed text-sm">
                                      {p.rationale || 'No rationale provided in digest.'}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="text-base font-semibold mb-3">Position details</h4>
                                    {tech ? (
                                      <p className="text-xs text-text-muted mb-3">
                                        Technicals as of{' '}
                                        <span className="font-mono text-text-secondary">{tech.date}</span>
                                        {' — '}
                                        RSI(14){' '}
                                        <span className="font-mono text-text-primary">
                                          {tech.rsi_14 != null ? tech.rsi_14.toFixed(1) : '—'}
                                        </span>
                                        {', '}
                                        vs SMA50{' '}
                                        <span className="font-mono text-text-primary">
                                          {tech.pct_vs_sma50 != null ? formatPct(tech.pct_vs_sma50) : '—'}
                                        </span>
                                      </p>
                                    ) : null}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                      <div className="bg-bg-secondary rounded-lg p-3 border border-border-subtle">
                                        <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">
                                          Asset class
                                        </span>
                                        <span className="text-sm font-medium">
                                          {formatCategory(p.category)}
                                        </span>
                                      </div>
                                      <div className="bg-bg-secondary rounded-lg p-3 border border-border-subtle">
                                        <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">
                                          Linked theses
                                        </span>
                                        <span className="text-sm space-x-1">
                                          {p.thesis_ids?.length > 0 ? (
                                            p.thesis_ids.map((id, j) => (
                                              <Badge key={j} variant="blue" className="mr-1 text-[0.7rem]">
                                                {thesisById.get(id)?.name ?? id}
                                              </Badge>
                                            ))
                                          ) : (
                                            '—'
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                    {p.pm_notes && (
                                      <div>
                                        <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">
                                          PM notes
                                        </span>
                                        <p className="text-text-muted text-sm leading-relaxed">{p.pm_notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                    {positions.length === 0 && (
                      <tr>
                        <td colSpan={14} className="text-center py-10 text-text-muted">
                          No active positions
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'history' && (
          <div className="flex gap-6 max-lg:flex-col">
            <div className="w-56 shrink-0 space-y-4 max-lg:w-full max-lg:flex max-lg:gap-4 max-lg:flex-wrap">
              {historyTimelineDates.length > 0 ? (
                <MiniCalendar
                  dates={historyTimelineDates}
                  runKindByDate={portfolioHistoryRunKindByDate}
                  selected={effHistoryDate}
                  onSelect={selectHistoryDate}
                />
              ) : (
                <div className="glass-card p-4 text-xs text-text-muted">No dated history yet.</div>
              )}
              {historyLatestDate && effHistoryDate && effHistoryDate !== historyLatestDate ? (
                <button
                  type="button"
                  onClick={clearHistoryDateParam}
                  className="w-full text-xs py-2 rounded-lg border border-border-subtle text-text-secondary hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  Jump to latest ({historyLatestDate})
                </button>
              ) : null}
            </div>

            <div className="flex-1 min-w-0 space-y-6">
              <StrategyThesisPanel
                highlightThesisId={highlightThesisParam}
                thesisHref={thesisHref}
                clearThesisHref={clearThesisHref}
              />

              <div className="glass-card p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <SectionTitle className="mb-0">Sleeve evolution</SectionTitle>
                  <div className="flex rounded-lg border border-border-subtle overflow-hidden text-xs">
                    <button
                      type="button"
                      onClick={() => setHistoryMode('ticker')}
                      className={`px-3 py-1.5 font-medium ${historyMode === 'ticker' ? 'bg-fin-blue/20 text-fin-blue' : 'text-text-muted hover:bg-white/[0.04]'}`}
                    >
                      Ticker
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryMode('category')}
                      className={`px-3 py-1.5 font-medium border-l border-border-subtle ${historyMode === 'category' ? 'bg-fin-blue/20 text-fin-blue' : 'text-text-muted hover:bg-white/[0.04]'}`}
                    >
                      Category
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryMode('thesis')}
                      className={`px-3 py-1.5 font-medium border-l border-border-subtle ${historyMode === 'thesis' ? 'bg-fin-blue/20 text-fin-blue' : 'text-text-muted hover:bg-white/[0.04]'}`}
                    >
                      Thesis
                    </button>
                  </div>
                </div>
                {showHistoryDateBanner ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-fin-blue/30 bg-fin-blue/10 px-3 py-2 text-xs">
                    <span className="text-text-secondary">
                      Viewing snapshot{' '}
                      <span className="font-mono text-text-primary">{dateParam}</span>
                      <span className="text-text-muted"> — click the chart or calendar to change.</span>
                    </span>
                    <button
                      type="button"
                      onClick={clearHistoryDateParam}
                      className="shrink-0 px-2 py-1 rounded border border-border-subtle hover:bg-white/[0.06] text-text-primary"
                    >
                      Clear
                    </button>
                  </div>
                ) : null}
                <div className="h-[380px]" aria-label="Sleeve weights stacked over time">
                  <SleeveStackedChart
                    data={sleeveData}
                    keys={sleeveKeys}
                    formatKey={formatSleeveKey}
                    aggregateOtherNote={historyMode === 'ticker'}
                    selectedDate={effHistoryDate}
                    onChartDateSelect={selectHistoryDate}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {effHistoryDate && lastUpdated && effHistoryDate !== lastUpdated ? (
                  <p className="text-xs text-text-muted px-1">
                    Weights below are for{' '}
                    <span className="font-mono text-text-secondary">{effHistoryDate}</span>. Thesis names,
                    notes, and metadata are from the latest digest snapshot (
                    <span className="font-mono text-text-secondary">{lastUpdated}</span>).
                  </p>
                ) : null}
                <div className="glass-card p-6">
                  <SectionTitle className="mb-1">Weight by thesis</SectionTitle>
                  <p className="text-xs text-text-muted mb-4">
                    Book aggregated from position history for{' '}
                    <span className="font-mono text-text-secondary">{effHistoryDate ?? '—'}</span>.
                  </p>
                  <div className="h-[280px]">
                    {thesisBarForChartForHistoryDate.length === 0 ? (
                      <p className="text-text-muted text-sm text-center py-12">
                        No thesis-linked weights on this date
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={thesisBarForChartForHistoryDate}
                          margin={{ left: 8, right: 16, top: 8, bottom: 48 }}
                        >
                          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: '#71717a', fontSize: 10 }}
                            interval={0}
                            angle={-24}
                            textAnchor="end"
                            height={56}
                          />
                          <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                          <Tooltip
                            contentStyle={{
                              background: '#1a1a1a',
                              border: '1px solid #2a2a2a',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                            }}
                            formatter={(val: number) => [`${Number(val).toFixed(1)}%`, 'Weight']}
                          />
                          <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="glass-card p-0 overflow-hidden">
                  <div className="px-5 py-4 border-b border-border-subtle bg-bg-secondary">
                    <h3 className="text-sm font-semibold">Thesis tracker</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[720px]">
                      <thead>
                        <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border-subtle">
                          <th className="text-left px-5 py-3">Thesis</th>
                          <th className="text-right px-5 py-3">Weight</th>
                          <th className="text-left px-5 py-3">Vehicle</th>
                          <th className="text-left px-5 py-3">Status</th>
                          <th className="text-left px-5 py-3">Invalidation</th>
                          <th className="px-5 py-3 w-10" aria-label="Expand" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {thesisBookRowsForHistoryDate.map((row) => {
                          const isOpen = expandedThesisId === row.id;
                          const label =
                            row.id === '_unlinked' ? 'Unlinked positions' : row.thesis?.name ?? row.id;
                          return (
                            <Fragment key={row.id}>
                              <tr
                                onClick={() => setExpandedThesisId(isOpen ? null : row.id)}
                                className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                              >
                                <td className="px-5 py-3 font-medium">{label}</td>
                                <td className="px-5 py-3 text-right font-mono tabular-nums font-semibold">
                                  {row.weight.toFixed(1)}%
                                </td>
                                <td className="px-5 py-3 font-mono text-text-secondary text-xs">
                                  {row.thesis?.vehicle ?? '—'}
                                </td>
                                <td className="px-5 py-3 text-text-secondary text-xs">
                                  {row.thesis?.status ?? '—'}
                                </td>
                                <td
                                  className="px-5 py-3 text-text-muted text-xs max-w-[200px] truncate"
                                  title={row.thesis?.invalidation ?? undefined}
                                >
                                  {row.thesis?.invalidation ?? '—'}
                                </td>
                                <td className="px-5 py-3 text-text-muted">
                                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </td>
                              </tr>
                              {isOpen && (
                                <tr className="bg-white/[0.02]">
                                  <td colSpan={6} className="px-6 py-5 border-t border-border-subtle">
                                    {row.id === '_unlinked' ? (
                                      <p className="text-text-muted text-sm leading-relaxed">
                                        Positions on this date are not linked to a named thesis in position
                                        history.
                                      </p>
                                    ) : (
                                      <>
                                        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                                          Summary
                                        </h4>
                                        <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                                          {row.thesis?.notes?.trim() || 'No summary in snapshot.'}
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                                          <div className="rounded-lg border border-border-subtle bg-bg-secondary/80 p-3">
                                            <span className="text-[10px] text-text-muted uppercase tracking-wider">
                                              Vehicle
                                            </span>
                                            <p className="text-sm mt-1">{row.thesis?.vehicle ?? '—'}</p>
                                          </div>
                                          <div className="rounded-lg border border-border-subtle bg-bg-secondary/80 p-3">
                                            <span className="text-[10px] text-text-muted uppercase tracking-wider">
                                              Status
                                            </span>
                                            <p className="text-sm mt-1">{row.thesis?.status ?? '—'}</p>
                                          </div>
                                          <div className="rounded-lg border border-border-subtle bg-bg-secondary/80 p-3">
                                            <span className="text-[10px] text-text-muted uppercase tracking-wider">
                                              Invalidation
                                            </span>
                                            <p className="text-sm mt-1 leading-snug">
                                              {row.thesis?.invalidation ?? '—'}
                                            </p>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                    {researchStripLinksForHistoryDate.length > 0 && effHistoryDate ? (
                                      <div className="mt-5 flex flex-wrap items-center gap-2">
                                        <span className="text-xs text-text-muted">Research</span>
                                        {researchStripLinksForHistoryDate.map((l) => (
                                          <Link
                                            key={l.docKey}
                                            href={`/library?date=${encodeURIComponent(effHistoryDate)}&docKey=${encodeURIComponent(l.docKey)}`}
                                            className="text-xs px-2.5 py-1 rounded-md bg-fin-blue/10 text-fin-blue hover:bg-fin-blue/20 transition-colors"
                                          >
                                            {l.label}
                                          </Link>
                                        ))}
                                        <Link
                                          href="/library"
                                          className="text-xs text-fin-blue/80 hover:text-fin-blue hover:underline"
                                        >
                                          Open library
                                        </Link>
                                      </div>
                                    ) : null}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                        {thesisBookRowsForHistoryDate.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-text-muted">
                              No theses in latest snapshot
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="glass-card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border-subtle bg-bg-secondary">
                  <div className="flex flex-wrap items-center gap-2">
                    <Calendar size={16} className="text-fin-amber shrink-0" aria-hidden />
                    <h3 className="text-sm font-semibold">Portfolio management artifacts</h3>
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    Deliberation, rebalance decisions, recommendations, and screener output for{' '}
                    <span className="font-mono text-text-secondary">{effHistoryDate ?? '—'}</span>.
                    {effHistoryDate &&
                    pmDocsForHistory.length === 0 &&
                    !portfolioDocDates.has(effHistoryDate) &&
                    positionHistoryDates.has(effHistoryDate) ? (
                      <span className="block mt-1">
                        No PM documents on this date; sleeve and thesis sections above still reflect this
                        snapshot.
                      </span>
                    ) : null}
                  </p>
                </div>
                {pmDocsForHistory.length === 0 ? (
                  <div className="px-5 py-10 text-center text-text-muted text-sm">
                    No portfolio process documents for this date.
                  </div>
                ) : (
                  <div className="divide-y divide-border-subtle">
                    {pmDocsForHistory.map((d) => {
                      const active = pmActiveFile?.id === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => openPmDocument(d)}
                          className={`w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors ${
                            active ? 'bg-fin-amber/5' : ''
                          }`}
                        >
                          <FileText size={14} className="text-fin-amber/70 shrink-0" />
                          <span className="font-mono text-sm">{d.title || d.filename || d.path}</span>
                          <span className="ml-auto text-[11px] text-text-muted">{d.phase ?? ''}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {pmActiveFile ? (
                <div className="glass-card p-0 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-bg-secondary">
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <FileText size={14} className="text-fin-amber shrink-0" />
                      <span className="font-mono truncate">{pmActiveFile.title || pmActiveFile.filename}</span>
                    </div>
                    <button
                      type="button"
                      onClick={closePmDocument}
                      className="text-text-muted hover:text-white shrink-0"
                      aria-label="Close document"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="p-6 max-w-none text-sm leading-relaxed overflow-auto max-h-[70vh]">
                    {pmLoading || !pmLibraryDoc ? (
                      <div className="text-text-secondary">Loading document…</div>
                    ) : (
                      <LibraryDocumentBody
                        view={pmLibraryDoc.view}
                        markdown={pmLibraryDoc.markdown}
                        payload={pmLibraryDoc.payload}
                        documentKey={pmLibraryDoc.document_key}
                        docDate={pmLibraryDoc.date}
                      />
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <div className="glass-card p-0 overflow-hidden">
            <div className="px-6 py-5 border-b border-border-subtle bg-bg-secondary">
              <h3 className="text-lg font-semibold">Activity</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[920px]">
                <thead>
                  <tr className="text-text-muted text-xs uppercase tracking-wider">
                    <th className="text-left px-5 py-3">Date</th>
                    <th className="text-left px-5 py-3">Ticker</th>
                    <th className="text-left px-5 py-3">Event</th>
                    <th className="text-right px-5 py-3">Prior wt</th>
                    <th className="text-right px-5 py-3">Weight</th>
                    <th className="text-right px-5 py-3">Δ wt</th>
                    <th className="text-right px-5 py-3">Since event</th>
                    <th className="text-left px-5 py-3 max-w-[200px]">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {activityEvents.map((ev, i) => {
                    const thesisName = ev.thesis_id ? thesisById.get(ev.thesis_id)?.name ?? ev.thesis_id : null;
                    const detailParts = [
                      ev.reason ? `Reason: ${ev.reason}` : null,
                      thesisName ? `Thesis: ${thesisName}` : ev.thesis_id ? `Thesis id: ${ev.thesis_id}` : null,
                      ev.price != null ? `Price: $${Number(ev.price).toFixed(2)}` : null,
                    ].filter(Boolean);
                    const rowTitle = detailParts.length ? detailParts.join('\n') : undefined;
                    return (
                      <tr key={`${ev.date}-${ev.ticker}-${i}`} className="hover:bg-white/[0.02]" title={rowTitle}>
                        <td className="px-5 py-3 font-mono text-xs text-text-secondary">{ev.date}</td>
                        <td className="px-5 py-3 font-semibold">{ev.ticker}</td>
                        <td className="px-5 py-3">
                          <Badge variant={eventBadgeVariant(ev.event)}>{ev.event}</Badge>
                        </td>
                        <td
                          className="px-5 py-3 text-right font-mono tabular-nums text-xs text-text-secondary"
                          title={ev.prev_weight_pct != null ? `Previous weight: ${ev.prev_weight_pct.toFixed(2)}%` : undefined}
                        >
                          {ev.prev_weight_pct != null ? `${ev.prev_weight_pct.toFixed(2)}%` : '—'}
                        </td>
                        <td
                          className="px-5 py-3 text-right font-mono tabular-nums text-xs"
                          title="Weight after this event"
                        >
                          {ev.weight_pct != null ? `${ev.weight_pct.toFixed(2)}%` : '—'}
                        </td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums text-xs text-text-secondary">
                          {ev.weight_change_pct != null
                            ? `${ev.weight_change_pct > 0 ? '+' : ''}${ev.weight_change_pct.toFixed(2)}pp`
                            : '—'}
                        </td>
                        <td
                          className={`px-5 py-3 text-right font-mono tabular-nums text-xs ${pnlColor(ev.cumulative_return_since_event_pct)}`}
                          title={
                            ev.cumulative_return_since_event_pct != null
                              ? `Return from event date to last refresh`
                              : undefined
                          }
                        >
                          {ev.cumulative_return_since_event_pct != null
                            ? formatPct(ev.cumulative_return_since_event_pct)
                            : '—'}
                        </td>
                        <td
                          className="px-5 py-3 text-text-muted text-xs max-w-[220px] truncate"
                          title={ev.reason ?? undefined}
                        >
                          {ev.reason ?? '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {activityEvents.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-text-muted">
                        No trades or rebalances in view.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function PortfolioPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-text-secondary">Loading…</div>}>
      <PortfolioPageContent />
    </Suspense>
  );
}
