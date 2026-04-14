'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDashboard } from '@/lib/dashboard-context';
import { SubpageStickyTabBar, SUBPAGE_MAX, subpageTabButtonClass } from '@/components/subpage-tab-bar';
import { getDocLibraryTier } from '@/lib/library-doc-tier';
import { getLibraryDocumentById } from '@/lib/queries';
import type { Doc } from '@/lib/types';
import { Layers, Activity, TrendingUp, Route } from 'lucide-react';
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
import { bucketAllocationsForPie, sortPmDocs } from './tabs/palette-and-format';
import AllocationsTab from './tabs/AllocationsTab';
import PerformanceTab from './tabs/PerformanceTab';
import AnalysisTab from './tabs/AnalysisTab';
import ActivityTab from './tabs/ActivityTab';

interface AllocationDatum {
  name: string;
  value: number;
}

type TabId = 'allocations' | 'performance' | 'analysis' | 'activity';

const VALID_TABS: TabId[] = ['allocations', 'performance', 'analysis', 'activity'];

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

  const pieCategoryBucketed = useMemo(
    () => bucketAllocationsForPie(categoryBarData.map(({ name, value }) => ({ name, value }))),
    [categoryBarData]
  );

  const pieThesisBucketed = useMemo(
    () => bucketAllocationsForPie(thesisBarRich.map(({ name, value }) => ({ name, value }))),
    [thesisBarRich]
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
    if (
      raw !== 'summary' &&
      raw !== 'history' &&
      raw !== 'pm_process' &&
      raw !== 'thesis' &&
      raw !== 'positions' &&
      raw !== 'theses' &&
      raw !== 'pm_analysis'
    )
      return;

    const p = new URLSearchParams(searchParams.toString());
    if (raw === 'summary') {
      p.delete('tab');
      p.delete('docKey');
      p.delete('date');
      p.delete('thesis');
    } else if (raw === 'positions') {
      p.delete('tab');
      p.delete('docKey');
      p.delete('date');
      p.delete('thesis');
    } else if (raw === 'history') {
      p.set('tab', 'analysis');
      if (!p.get('date') && defaultHistoryDate) p.set('date', defaultHistoryDate);
    } else if (raw === 'pm_process') {
      p.set('tab', 'analysis');
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
      p.set('tab', 'analysis');
      if (!p.get('date') && defaultHistoryDate) p.set('date', defaultHistoryDate);
    } else if (raw === 'theses' || raw === 'pm_analysis') {
      p.set('tab', 'analysis');
    }
    const target = p.toString();
    router.replace(target ? `${pathname}?${target}` : pathname, { scroll: false });
  }, [searchParams, pathname, router, data?.docs, lastUpdated, defaultHistoryDate]);

  useEffect(() => {
    const raw = searchParams.get('tab');
    let mapped: TabId = 'allocations';
    if (!raw || raw === 'summary') mapped = 'allocations';
    else if (raw === 'history') mapped = 'analysis';
    else if (raw === 'pm_process') mapped = 'analysis';
    else if (raw === 'thesis') mapped = 'analysis';
    else if (raw === 'theses' || raw === 'pm_analysis') mapped = 'analysis';
    else if (raw === 'positions') mapped = 'allocations';
    else if (VALID_TABS.includes(raw as TabId)) mapped = raw as TabId;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync tab from URL
    setTab(mapped);
  }, [searchParams]);

  const docKeyParam = searchParams.get('docKey');

  useEffect(() => {
    if (!effHistoryDate || !data?.docs) return;
    if (searchParams.get('tab') !== 'analysis') return;
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
    if (next !== 'analysis') {
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
      if (next !== 'analysis') {
        p.delete('docKey');
        p.delete('date');
        p.delete('thesis');
      } else {
        if (!p.get('date') && defaultHistoryDate) p.set('date', defaultHistoryDate);
      }
    }
    const s = p.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }

  function openPmDocument(doc: Doc) {
    setTab('analysis');
    const p = new URLSearchParams(searchParams.toString());
    p.set('tab', 'analysis');
    p.set('date', doc.date);
    p.set('docKey', doc.path);
    p.delete('thesis');
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  function closePmDocument() {
    setPmActiveFile(null);
    setPmLibraryDoc(null);
    const p = new URLSearchParams(searchParams.toString());
    p.delete('docKey');
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  function selectAnalysisDate(iso: string) {
    if (!historyDateSet.has(iso)) return;
    const p = new URLSearchParams(searchParams.toString());
    p.set('tab', 'analysis');
    p.set('date', iso);
    p.delete('docKey');
    setPmActiveFile(null);
    setPmLibraryDoc(null);
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
      p.set('tab', 'analysis');
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
    { id: 'analysis', label: 'Analysis', icon: Route },
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
    <div className="flex min-h-full flex-col">
      <SubpageStickyTabBar aria-label="Portfolio sections">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => navigateTab(id)}
            className={subpageTabButtonClass(tab === id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </SubpageStickyTabBar>

      <div className={`${SUBPAGE_MAX} flex-1 space-y-6 py-4 md:py-5`}>
        {tab === 'allocations' && (
          <AllocationsTab
            lastUpdated={lastUpdated}
            pieTicker={pieDataBucketed}
            pieCategory={pieCategoryBucketed}
            pieThesis={pieThesisBucketed}
            positions={positions}
            thesisById={thesisById}
          />
        )}

        {tab === 'performance' && <PerformanceTab />}

        {tab === 'analysis' && (
          <AnalysisTab
            historyTimelineDates={historyTimelineDates}
            portfolioHistoryRunKindByDate={portfolioHistoryRunKindByDate}
            effHistoryDate={effHistoryDate}
            onSelectHistoryDate={selectAnalysisDate}
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
    </div>
  );
}
