import { useState, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, DollarSign, PieChart, Activity, Zap, Shield, Target, AlertTriangle } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Performance({ data }) {
  const { portfolio, positions, ratios, benchmarks, calculated } = data;
  const metrics = calculated;
  
  const [selectedBenchmark, setSelectedBenchmark] = useState(
    portfolio.meta.benchmarks?.[0] || 'SPY'
  );

  const fp = (v) => v != null ? `${v > 0 ? '+' : ''}${v.toFixed(2)}%` : '—';
  const pnlClass = (v) => v == null ? '' : (v >= 0 ? 'positive' : 'negative');

  // Performance vs Benchmark Chart Data
  const lineConfig = useMemo(() => {
    const bHist = benchmarks[selectedBenchmark]?.history || [];
    const dates = bHist.map(h => h.date);
    const bValues = bHist.map(h => h.price);

    const baseVal = bValues[0] || 1;
    const bNorm = bValues.map(v => (v / baseVal) * 100);

    let navValues = portfolio.snapshots?.map(s => s.nav) || [];
    let navDates = portfolio.snapshots?.map(s => s.date) || [];
    
    if (navDates.length < 2) {
      navDates = dates.slice(-10);
      navValues = Array(10).fill(100);
    }

    return {
      data: {
        labels: dates.length > 0 ? dates : navDates,
        datasets: [
          {
            label: 'Portfolio NAV (Base 100)',
            data: navValues,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59,130,246,0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 0
          },
          ...(bHist.length > 0 ? [{
            label: `${selectedBenchmark} (Base 100)`,
            data: bNorm,
            borderColor: '#a1a1aa',
            borderDash: [5, 5],
            fill: false,
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 0
          }] : [])
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { color: '#fff' } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#71717a' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#71717a' } }
        }
      }
    };
  }, [benchmarks, selectedBenchmark, portfolio.snapshots]);


  return (
    <div>
      {/* Top Stats */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="glass-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <div className="text-label">Portfolio P&L</div>
            <TrendingUp size={16} color="var(--accent-blue)" />
          </div>
          <div className={`stat-value stat-pnl ${pnlClass(metrics.portfolio_pnl)}`}>
            {fp(metrics.portfolio_pnl)}
          </div>
        </div>
        <div className="glass-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <div className="text-label">Cash Reserve</div>
            <DollarSign size={16} color="var(--accent-green)" />
          </div>
          <div className="stat-value">{metrics.cash_pct.toFixed(1)}%</div>
        </div>
        <div className="glass-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <div className="text-label">Invested Capital</div>
            <PieChart size={16} color="var(--accent-amber)" />
          </div>
          <div className="stat-value">{metrics.total_invested.toFixed(1)}%</div>
        </div>
        <div className="glass-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <div className="text-label">Active Signals</div>
            <Activity size={16} color="var(--accent-purple)" />
          </div>
          <div className="stat-value">{positions.length + ratios.length}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="text-h3">Performance vs Benchmark</h3>
          <select 
            className="modern-select" 
            value={selectedBenchmark} 
            onChange={(e) => setSelectedBenchmark(e.target.value)}
          >
            {Object.keys(benchmarks).map(b => (
              <option key={b} value={b}>vs {b}</option>
            ))}
          </select>
        </div>
        <div style={{ height: '350px', marginTop: '16px' }}>
          <Line data={lineConfig.data} options={lineConfig.options} />
        </div>
      </div>

      {/* Advanced Performance Metrics */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="glass-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <div className="text-label">Sharpe Ratio</div>
            <Target size={16} color="var(--accent-blue)" />
          </div>
          <div className="stat-value">
            {metrics.sharpe ? metrics.sharpe.toFixed(2) : '—'}
          </div>
          <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px'}}>Risk-adjusted return</div>
        </div>
        <div className="glass-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <div className="text-label">Ann. Volatility</div>
            <Zap size={16} color="var(--accent-amber)" />
          </div>
          <div className="stat-value">
            {metrics.volatility ? (metrics.volatility * 100).toFixed(2) + '%' : '—'}
          </div>
          <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px'}}>Annualized standard deviation</div>
        </div>
        <div className="glass-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <div className="text-label">Max Drawdown</div>
            <AlertTriangle size={16} color="var(--accent-red)" />
          </div>
          <div className="stat-value">
            {metrics.max_drawdown ? (metrics.max_drawdown * 100).toFixed(2) + '%' : '—'}
          </div>
          <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px'}}>Peak to trough decline</div>
        </div>
        <div className="glass-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <div className="text-label">Alpha vs {selectedBenchmark}</div>
            <Shield size={16} color="var(--accent-purple)" />
          </div>
          <div className={`stat-value ${pnlClass(metrics.alpha)}`}>
            {metrics.alpha != null ? fp(metrics.alpha * 100) : '—'}
          </div>
          <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px'}}>Excess return (annualized)</div>
        </div>
      </div>
    </div>
  );
}
