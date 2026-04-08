/**
 * Data access layer — All data from Supabase. No static JSON fallback.
 * Components call these functions; never touch Supabase directly.
 */
import { supabase, isSupabaseConfigured } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, TableRow } from './database.types';
import type {
  DashboardData,
  Position,
  Thesis,
  Doc,
  BenchmarkHistoryMap,
} from './types';
import { renderDigestMarkdownFromSnapshot, type DigestSnapshot } from './render-digest-from-snapshot';
import { renderDocumentMarkdownFromPayload } from './render-document-from-payload';
import { DASHBOARD_BENCHMARK_TICKERS } from './benchmark-tickers';

type SB = SupabaseClient<Database>;

async function querySupabase<T>(
  queryFn: (sb: SB) => PromiseLike<{ data: T | null; error: unknown }>,
  { retries = 3, delayMs = 500 }: { retries?: number; delayMs?: number } = {}
): Promise<T> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const { data, error } = await queryFn(supabase);
      if (error) throw error;
      if (data === null) throw new Error('No data returned');
      return data;
    } catch (err) {
      lastError = err;
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

/**
 * Load the complete dashboard data assembled from Supabase tables.
 */
export async function getFullDashboardData(): Promise<DashboardData> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  const [
    snapshotRes, positionsRes, thesesRes, navRes,
    benchRes, metricsRes, docsRes,
  ] = await Promise.all([
    supabase.from('daily_snapshots').select('*').order('date', { ascending: false }).limit(1).single(),
    supabase.from('positions').select('*').order('date', { ascending: false }).limit(1000),
    supabase.from('theses').select('*').order('date', { ascending: false }).limit(50),
    supabase.from('nav_history').select('*').order('date', { ascending: true }),
    supabase
      .from('price_history')
      .select('date, ticker, close')
      .in('ticker', [...DASHBOARD_BENCHMARK_TICKERS])
      .order('date', { ascending: true }),
    supabase.from('portfolio_metrics').select('*').order('date', { ascending: false }).limit(1).single(),
    supabase.from('documents')
      .select('id, date, title, doc_type, phase, category, segment, sector, run_type, document_key')
      .order('date', { ascending: false })
      .limit(500),
  ]);

  if (docsRes.error) {
    console.error('Supabase documents query:', docsRes.error);
  }
  if (benchRes.error) {
    console.error('Supabase price_history (benchmarks) query:', benchRes.error);
  }

  const snapshot: TableRow<'daily_snapshots'> = snapshotRes.data ?? ({} as TableRow<'daily_snapshots'>);
  const rawSnapshotJson = snapshot.snapshot;
  const snapshotJson: DigestSnapshot | null =
    rawSnapshotJson != null && typeof rawSnapshotJson === 'object' && !Array.isArray(rawSnapshotJson)
      ? (rawSnapshotJson as DigestSnapshot)
      : null;
  const allPositions: TableRow<'positions'>[] = positionsRes.data ?? [];
  const allTheses: TableRow<'theses'>[] = thesesRes.data ?? [];
  const navHistory: TableRow<'nav_history'>[] = navRes.data ?? [];
  const benchRows: Pick<TableRow<'price_history'>, 'date' | 'ticker' | 'close'>[] =
    benchRes.data ?? [];
  const metrics: TableRow<'portfolio_metrics'> = metricsRes.data ?? ({} as TableRow<'portfolio_metrics'>);
  const rawDocs: Pick<
    TableRow<'documents'>,
    'id' | 'date' | 'title' | 'doc_type' | 'phase' | 'category' | 'segment' | 'sector' | 'run_type' | 'document_key'
  >[] = docsRes.data ?? [];

  const posDates = [...new Set(allPositions.map((p) => p.date))];
  const latestPosDate = posDates.length ? posDates[0] : null;
  const prevPosDate = posDates.length > 1 ? posDates[1] : null;
  const currentPositions = latestPosDate ? allPositions.filter((p) => p.date === latestPosDate) : [];
  const prevPositions = prevPosDate ? allPositions.filter((p) => p.date === prevPosDate) : [];
  const prevWeightByTicker = new Map(prevPositions.map((p) => [p.ticker, Number(p.weight_pct ?? 0)]));

  const latestThesisDate = allTheses.length ? allTheses[0].date : null;
  const currentTheses = latestThesisDate
    ? allTheses.filter((t) => t.date === latestThesisDate)
    : [];

  // Parse regime — stored as JSONB (may come back as string or object)
  const rawRegime = snapshot.regime;
  const regime: Record<string, unknown> =
    typeof rawRegime === 'string'
      ? (JSON.parse(rawRegime) as Record<string, unknown>)
      : typeof rawRegime === 'object' && rawRegime !== null
      ? (rawRegime as Record<string, unknown>)
      : {};

  // Build benchmark map
  const benchmarks: BenchmarkHistoryMap = {};
  for (const row of benchRows) {
    if (!benchmarks[row.ticker]) {
      benchmarks[row.ticker] = { current: null, history: [] };
    }
    benchmarks[row.ticker].history.push({ date: row.date, price: Number(row.close) });
  }
  for (const bData of Object.values(benchmarks)) {
    if (bData.history.length) {
      bData.current = bData.history[bData.history.length - 1].price;
    }
  }

  const theses: Thesis[] = currentTheses.map((t) => ({
    id: t.thesis_id,
    name: t.name,
    vehicle: t.vehicle,
    invalidation: t.invalidation,
    status: t.status,
    notes: t.notes,
  }));

  const docs: Doc[] = rawDocs.map((d) => ({
    id: d.id,
    date: d.date,
    title: d.title,
    type: d.doc_type,
    phase: d.phase,
    category: d.category,
    segment: d.segment,
    sector: d.sector,
    runType: d.run_type,
    path: d.document_key,
    filename: d.document_key?.split('/').pop() || d.document_key,
  }));

  // Proposed positions from the published digest snapshot (DB-first).
  const proposedPositions: { ticker: string; weight_pct: number; action?: string }[] = (() => {
    const p = snapshotJson?.portfolio as Record<string, unknown> | undefined;
    const pp = p?.proposed_positions;
    if (!Array.isArray(pp)) return [];
    return pp
      .map((x) => {
        if (!x || typeof x !== 'object') return null;
        const o = x as Record<string, unknown>;
        const ticker = String(o.ticker || '').trim().toUpperCase();
        const weight = Number(o.weight_pct ?? NaN);
        if (!ticker || Number.isNaN(weight)) return null;
        return { ticker, weight_pct: weight, action: o.action != null ? String(o.action) : undefined };
      })
      .filter(Boolean) as { ticker: string; weight_pct: number; action?: string }[];
  })();

  // Treat proposed_positions as executed immediately (post-trade = current).
  const effectiveCurrentPositions: TableRow<'positions'>[] = proposedPositions.length
    ? proposedPositions
        .filter((p) => Number(p.weight_pct ?? 0) > 0)
        .map((p) => {
          const base = currentPositions.find((cp) => cp.ticker === p.ticker);
          return {
            ...(base || ({
              date: latestPosDate,
              ticker: p.ticker,
              name: p.ticker,
              category: null,
              weight_pct: 0,
              entry_date: null,
              entry_price: null,
              current_price: null,
              rationale: null,
              thesis_id: null,
              pm_notes: null,
              unrealized_pnl_pct: null,
              day_change_pct: null,
              since_entry_return_pct: null,
              contribution_pct: null,
              metrics_as_of: null,
            } as unknown as TableRow<'positions'>)),
            ticker: p.ticker,
            weight_pct: Number(p.weight_pct ?? 0),
          } as TableRow<'positions'>;
        })
    : currentPositions;

  // Fill position prices/P&L from price_history when positions table is sparse.
  const posTickers = [...new Set(effectiveCurrentPositions.map((p) => p.ticker))];
  const entryDatesByTicker = new Map(
    effectiveCurrentPositions
      .map((p) => [p.ticker, p.entry_date] as const)
      .filter(([, d]) => !!d)
  );

  const priceRows = posTickers.length
    ? await querySupabase<
        Pick<TableRow<'price_history'>, 'date' | 'ticker' | 'close'>[]
      >((sb) =>
        sb
          .from('price_history')
          .select('date, ticker, close')
          .in('ticker', posTickers)
          // fetch a small recent window + any entry dates
          .order('date', { ascending: false })
          .limit(5000)
      )
    : [];

  const closesByTicker = new Map<string, Array<{ date: string; close: number }>>();
  for (const r of priceRows) {
    const arr = closesByTicker.get(r.ticker) || [];
    arr.push({ date: r.date, close: Number(r.close) });
    closesByTicker.set(r.ticker, arr);
  }
  for (const [t, arr] of closesByTicker) {
    arr.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    closesByTicker.set(t, arr);
  }

  function closeOnOrAfter(ticker: string, date: string): number | null {
    const arr = closesByTicker.get(ticker);
    if (!arr?.length) return null;
    for (const p of arr) {
      if (p.date >= date) return p.close;
    }
    return null;
  }

  function latestClose(ticker: string): { curr: number | null; prev: number | null } {
    const arr = closesByTicker.get(ticker);
    if (!arr?.length) return { curr: null, prev: null };
    const curr = arr[arr.length - 1]?.close ?? null;
    const prev = arr.length > 1 ? arr[arr.length - 2]?.close ?? null : null;
    return { curr, prev };
  }

  const totalInvested = effectiveCurrentPositions.reduce(
    (s, p) => s + Number(p.weight_pct ?? 0),
    0
  );

  const positions: Position[] = effectiveCurrentPositions.map((p) => ({
    // Prices: prefer explicit position fields; else derive from price_history
    ticker: p.ticker,
    name: p.name ?? p.ticker,
    type: 'LONG' as const,
    weight_actual: Number(p.weight_pct ?? 0),
    weight_delta:
      latestPosDate && prevPosDate
        ? Number(p.weight_pct ?? 0) - (prevWeightByTicker.get(p.ticker) ?? 0)
        : null,
    current_price: p.current_price != null ? Number(p.current_price) : latestClose(p.ticker).curr,
    entry_price:
      p.entry_price != null
        ? Number(p.entry_price)
        : p.entry_date
          ? closeOnOrAfter(p.ticker, p.entry_date)
          : null,
    entry_date: p.entry_date ?? null,
    rationale: p.rationale ?? '',
    thesis_ids: p.thesis_id ? [p.thesis_id] : [],
    category: p.category ?? '',
    pm_notes: p.pm_notes ?? '',
    stats: {},
    unrealized_pnl_pct: (() => {
      if (p.unrealized_pnl_pct != null) return Number(p.unrealized_pnl_pct);
      const entry =
        p.entry_price != null
          ? Number(p.entry_price)
          : p.entry_date
            ? closeOnOrAfter(p.ticker, p.entry_date)
            : null;
      const curr =
        p.current_price != null ? Number(p.current_price) : latestClose(p.ticker).curr;
      if (!entry || !curr || entry <= 0) return null;
      return ((curr - entry) / entry) * 100;
    })(),
    day_change_pct: (() => {
      if (p.day_change_pct != null) return Number(p.day_change_pct);
      const { curr, prev } = latestClose(p.ticker);
      if (!curr || !prev || prev <= 0) return null;
      return ((curr - prev) / prev) * 100;
    })(),
    since_entry_return_pct: (() => {
      if (p.since_entry_return_pct != null) return Number(p.since_entry_return_pct);
      // If we can compute unrealized_pnl_pct, reuse it as since-entry return.
      const entry =
        p.entry_price != null
          ? Number(p.entry_price)
          : p.entry_date
            ? closeOnOrAfter(p.ticker, p.entry_date)
            : null;
      const curr =
        p.current_price != null ? Number(p.current_price) : latestClose(p.ticker).curr;
      if (!entry || !curr || entry <= 0) return null;
      return ((curr - entry) / entry) * 100;
    })(),
    contribution_pct: (() => {
      if (p.contribution_pct != null) return Number(p.contribution_pct);
      const entry =
        p.entry_price != null
          ? Number(p.entry_price)
          : p.entry_date
            ? closeOnOrAfter(p.ticker, p.entry_date)
            : null;
      const curr =
        p.current_price != null ? Number(p.current_price) : latestClose(p.ticker).curr;
      if (!entry || !curr || entry <= 0) return null;
      const pnlPct = ((curr - entry) / entry) * 100;
      return (pnlPct * Number(p.weight_pct ?? 0)) / 100;
    })(),
    metrics_as_of: p.metrics_as_of ?? null,
  }));

  const rebalanceActions = proposedPositions.map((p) => {
    const curr = Number(currentPositions.find((cp) => cp.ticker === p.ticker)?.weight_pct ?? 0);
    const rec = Number(p.weight_pct ?? 0);
    const action =
      rec === 0 && curr > 0 ? 'EXIT' :
      rec > 0 && curr === 0 ? 'OPEN' :
      Math.abs(rec - curr) >= 0.01 ? 'REBALANCE' :
      'HOLD';
    return { ticker: p.ticker, current_pct: curr, recommended_pct: rec, action };
  });

  return {
    portfolio: {
      meta: {
        name: 'Market Digest Dynamic Portfolio',
        base_currency: 'CAD',
        last_updated: snapshot.date ?? latestPosDate,
        benchmarks: Object.keys(benchmarks),
      },
      snapshots: navHistory.map((h) => ({ date: h.date, nav: Number(h.nav) })),
      strategy: {
        regime: String(regime.label ?? regime.regime ?? 'Unknown'),
        regime_label: String(regime.bias ?? regime.regime_label ?? 'neutral'),
        summary: String(regime.summary ?? ''),
        actionable: (snapshot.actionable ?? []) as string[],
        risks: (snapshot.risks ?? []) as string[],
        theses,
        next_review: 'Daily',
      },
    },
    positions,
    portfolio_management: {
      current_positions: effectiveCurrentPositions.map((p) => ({
        ticker: p.ticker,
        name: p.name ?? p.ticker,
        category: p.category ?? '',
        weight_pct: Number(p.weight_pct ?? 0),
        thesis_ids: p.thesis_id ? [p.thesis_id] : [],
        entry_date: p.entry_date ?? null,
        entry_price_usd: p.entry_price != null ? Number(p.entry_price) : null,
        notes: p.pm_notes ?? '',
      })),
      proposed_positions: proposedPositions.map((p) => ({
        ticker: p.ticker,
        weight_pct: p.weight_pct,
        action: p.action || '',
      })),
      constraints: {},
      rebalance_actions: rebalanceActions,
      pnl_fx_impact: null,
    },
    position_history: allPositions.map((p) => ({
      date: p.date,
      ticker: p.ticker,
      weight_pct: Number(p.weight_pct ?? 0),
    })),
    ratios: [],
    docs,
    benchmarks,
    calculated: {
      portfolio_pnl: metrics.pnl_pct != null ? Number(metrics.pnl_pct) : 0,
      total_invested:
        proposedPositions.length > 0
          ? totalInvested
          : (metrics.total_invested != null ? Number(metrics.total_invested) : totalInvested),
      cash_pct:
        proposedPositions.length > 0
          ? 100 - totalInvested
          : (metrics.cash_pct != null ? Number(metrics.cash_pct) : 100 - totalInvested),
      sharpe: metrics.sharpe != null ? Number(metrics.sharpe) : 0,
      volatility: metrics.volatility != null ? Number(metrics.volatility) : 0,
      max_drawdown: metrics.max_drawdown != null ? Number(metrics.max_drawdown) : 0,
      alpha: metrics.alpha != null ? Number(metrics.alpha) : 0,
    },
  };
}

export async function getDocumentContentById(
  id: string
): Promise<Pick<TableRow<'documents'>, 'id' | 'content'>> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  type DocPick = Pick<
    TableRow<'documents'>,
    'id' | 'content' | 'payload' | 'date' | 'document_key'
  >;

  const { data: row, error } = await supabase
    .from('documents')
    .select('id, content, payload, date, document_key')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!row) throw new Error('Document not found');

  const doc = row as DocPick;

  let md = doc.content?.trim() ? doc.content : '';

  if (!md && doc.payload != null) {
    md = renderDocumentMarkdownFromPayload(doc.payload) || md;
  }

  if (!md && doc.document_key === 'digest') {
    const { data: snapRow } = await supabase
      .from('daily_snapshots')
      .select('digest_markdown, snapshot')
      .eq('date', doc.date)
      .maybeSingle();
    const snap = snapRow as {
      digest_markdown?: string | null;
      snapshot?: TableRow<'daily_snapshots'>['snapshot'];
    } | null;
    if (snap?.digest_markdown?.trim()) {
      md = snap.digest_markdown;
    } else if (snap?.snapshot != null && typeof snap.snapshot === 'object' && !Array.isArray(snap.snapshot)) {
      try {
        md = renderDigestMarkdownFromSnapshot(snap.snapshot as DigestSnapshot);
      } catch {
        /* noop */
      }
    }
  }

  return { id: doc.id, content: md || '_No content available._' };
}

export async function getDailySnapshots(
  fromDate?: string
): Promise<TableRow<'daily_snapshots'>[]> {
  return querySupabase<TableRow<'daily_snapshots'>[]>((sb) => {
    let q = sb
      .from('daily_snapshots')
      .select('date, regime, market_data, segment_biases')
      .order('date', { ascending: true });
    if (fromDate) q = q.gte('date', fromDate);
    return q;
  });
}

export async function getPositionHistory(
  fromDate?: string
): Promise<Pick<TableRow<'positions'>, 'date' | 'ticker' | 'weight_pct'>[]> {
  return querySupabase((sb) => {
    let q = sb
      .from('positions')
      .select('date, ticker, weight_pct')
      .order('date', { ascending: true });
    if (fromDate) q = q.gte('date', fromDate);
    return q;
  });
}

export async function getPositionEvents(
  fromDate?: string,
  ticker?: string
): Promise<TableRow<'position_events'>[]> {
  return querySupabase((sb) => {
    let q = sb
      .from('position_events')
      .select('*')
      .order('date', { ascending: false });
    if (fromDate) q = q.gte('date', fromDate);
    if (ticker) q = q.eq('ticker', ticker);
    return q.limit(200);
  });
}
