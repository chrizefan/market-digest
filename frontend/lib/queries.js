/**
 * Data access layer — All data from Supabase. No static JSON fallback.
 * Components call these functions; never touch Supabase directly.
 */
import { supabase, isSupabaseConfigured } from './supabase';

async function querySupabase(queryFn, { retries = 3, delayMs = 500 } = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const { data, error } = await queryFn(supabase);
      if (error) throw error;
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
export async function getFullDashboardData() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  const [
    snapshotRes, positionsRes, thesesRes, navRes,
    benchRes, metricsRes, docsRes,
  ] = await Promise.all([
    supabase.from('daily_snapshots').select('*').order('date', { ascending: false }).limit(1).single(),
    supabase.from('positions').select('*').order('date', { ascending: false }).limit(50),
    supabase.from('theses').select('*').order('date', { ascending: false }).limit(50),
    supabase.from('nav_history').select('*').order('date', { ascending: true }),
    supabase.from('benchmark_history').select('*').order('date', { ascending: true }),
    supabase.from('portfolio_metrics').select('*').order('date', { ascending: false }).limit(1).single(),
    supabase.from('documents').select('id, date, title, doc_type, phase, category, segment, sector, run_type, file_path').order('date', { ascending: false }).limit(500),
  ]);

  const snapshot = snapshotRes.data || {};
  const positions = positionsRes.data || [];
  const theses = thesesRes.data || [];
  const navHistory = navRes.data || [];
  const benchRows = benchRes.data || [];
  const metrics = metricsRes.data || {};
  const docs = docsRes.data || [];

  const latestPosDate = positions.length ? positions[0].date : null;
  const currentPositions = latestPosDate ? positions.filter((p) => p.date === latestPosDate) : [];
  const latestThesisDate = theses.length ? theses[0].date : null;
  const currentTheses = latestThesisDate ? theses.filter((t) => t.date === latestThesisDate) : [];
  const regime = typeof snapshot.regime === 'string' ? JSON.parse(snapshot.regime) : (snapshot.regime || {});

  const benchmarks = {};
  for (const row of benchRows) {
    if (!benchmarks[row.ticker]) benchmarks[row.ticker] = { current: null, history: [] };
    benchmarks[row.ticker].history.push({ date: row.date, price: Number(row.price) });
  }
  for (const bData of Object.values(benchmarks)) {
    if (bData.history.length) bData.current = bData.history[bData.history.length - 1].price;
  }

  const totalInvested = currentPositions.reduce((s, p) => s + Number(p.weight_pct || 0), 0);

  return {
    portfolio: {
      meta: { name: 'Market Digest Dynamic Portfolio', base_currency: 'CAD', last_updated: snapshot.date || latestPosDate, benchmarks: Object.keys(benchmarks) },
      snapshots: navHistory.map((h) => ({ date: h.date, nav: Number(h.nav) })),
      strategy: {
        regime: regime.label || regime.regime || 'Unknown',
        regime_label: regime.bias || regime.regime_label || 'neutral',
        summary: regime.summary || '',
        actionable: snapshot.actionable || [],
        risks: snapshot.risks || [],
        theses: currentTheses.map((t) => ({ id: t.thesis_id, name: t.name, vehicle: t.vehicle, invalidation: t.invalidation, status: t.status, notes: t.notes })),
        next_review: 'Daily',
      },
    },
    positions: currentPositions.map((p) => ({
      ticker: p.ticker, name: p.name || p.ticker, type: 'LONG',
      weight_actual: Number(p.weight_pct || 0),
      current_price: p.current_price != null ? Number(p.current_price) : null,
      entry_price: p.entry_price != null ? Number(p.entry_price) : null,
      entry_date: p.entry_date || null,
      rationale: p.rationale || '', thesis_ids: p.thesis_id ? [p.thesis_id] : [],
      category: p.category || '', pm_notes: p.pm_notes || '', stats: {},
    })),
    portfolio_management: { current_positions: currentPositions.map((p) => ({ ticker: p.ticker, name: p.name || p.ticker, category: p.category || '', weight_pct: Number(p.weight_pct || 0), thesis_ids: p.thesis_id ? [p.thesis_id] : [], entry_date: p.entry_date, entry_price_usd: p.entry_price != null ? Number(p.entry_price) : null, notes: p.pm_notes || '' })), proposed_positions: [], constraints: {}, rebalance_actions: [], pnl_fx_impact: null },
    ratios: [],
    docs: docs.map((d) => ({ id: d.id, date: d.date, title: d.title, type: d.doc_type, phase: d.phase, category: d.category, segment: d.segment, sector: d.sector, runType: d.run_type, path: d.file_path })),
    benchmarks,
    calculated: {
      portfolio_pnl: metrics.pnl_pct != null ? Number(metrics.pnl_pct) : 0,
      total_invested: metrics.total_invested != null ? Number(metrics.total_invested) : totalInvested,
      cash_pct: metrics.cash_pct != null ? Number(metrics.cash_pct) : (100 - totalInvested),
      sharpe: metrics.sharpe != null ? Number(metrics.sharpe) : 0,
      volatility: metrics.volatility != null ? Number(metrics.volatility) : 0,
      max_drawdown: metrics.max_drawdown != null ? Number(metrics.max_drawdown) : 0,
      alpha: metrics.alpha != null ? Number(metrics.alpha) : 0,
    },
  };
}

export async function getDailySnapshots(fromDate) {
  return querySupabase(
    (sb) => {
      let q = sb.from('daily_snapshots').select('date, regime, market_data, segment_biases').order('date', { ascending: true });
      if (fromDate) q = q.gte('date', fromDate);
      return q;
    }
  );
}

export async function getPositionHistory(fromDate) {
  return querySupabase(
    (sb) => {
      let q = sb.from('positions').select('date, ticker, weight_pct').order('date', { ascending: true });
      if (fromDate) q = q.gte('date', fromDate);
      return q;
    }
  );
}

export async function getPositionEvents(fromDate, ticker) {
  return querySupabase(
    (sb) => {
      let q = sb.from('position_events').select('*').order('date', { ascending: false });
      if (fromDate) q = q.gte('date', fromDate);
      if (ticker) q = q.eq('ticker', ticker);
      return q.limit(200);
    }
  );
}
