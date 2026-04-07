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
    supabase.from('positions').select('*').order('date', { ascending: false }).limit(50),
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

  const latestPosDate = allPositions.length ? allPositions[0].date : null;
  const currentPositions = latestPosDate
    ? allPositions.filter((p) => p.date === latestPosDate)
    : [];

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

  const totalInvested = currentPositions.reduce(
    (s, p) => s + Number(p.weight_pct ?? 0),
    0
  );

  const positions: Position[] = currentPositions.map((p) => ({
    ticker: p.ticker,
    name: p.name ?? p.ticker,
    type: 'LONG' as const,
    weight_actual: Number(p.weight_pct ?? 0),
    current_price: p.current_price != null ? Number(p.current_price) : null,
    entry_price: p.entry_price != null ? Number(p.entry_price) : null,
    entry_date: p.entry_date ?? null,
    rationale: p.rationale ?? '',
    thesis_ids: p.thesis_id ? [p.thesis_id] : [],
    category: p.category ?? '',
    pm_notes: p.pm_notes ?? '',
    stats: {},
    unrealized_pnl_pct:
      p.unrealized_pnl_pct != null ? Number(p.unrealized_pnl_pct) : null,
    day_change_pct: p.day_change_pct != null ? Number(p.day_change_pct) : null,
    since_entry_return_pct:
      p.since_entry_return_pct != null ? Number(p.since_entry_return_pct) : null,
    contribution_pct:
      p.contribution_pct != null ? Number(p.contribution_pct) : null,
    metrics_as_of: p.metrics_as_of ?? null,
  }));

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
      current_positions: currentPositions.map((p) => ({
        ticker: p.ticker,
        name: p.name ?? p.ticker,
        category: p.category ?? '',
        weight_pct: Number(p.weight_pct ?? 0),
        thesis_ids: p.thesis_id ? [p.thesis_id] : [],
        entry_date: p.entry_date ?? null,
        entry_price_usd: p.entry_price != null ? Number(p.entry_price) : null,
        notes: p.pm_notes ?? '',
      })),
      proposed_positions: [],
      constraints: {},
      rebalance_actions: [],
      pnl_fx_impact: null,
    },
    ratios: [],
    docs,
    benchmarks,
    calculated: {
      portfolio_pnl: metrics.pnl_pct != null ? Number(metrics.pnl_pct) : 0,
      total_invested:
        metrics.total_invested != null ? Number(metrics.total_invested) : totalInvested,
      cash_pct:
        metrics.cash_pct != null ? Number(metrics.cash_pct) : 100 - totalInvested,
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
