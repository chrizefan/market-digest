import { Clock } from 'lucide-react';

export default function Layout({ activeTab, meta, children }) {
  const titles = {
    portfolio: 'Asset Allocation',
    performance: 'Performance',
    strategy: 'Strategy & Thesis',
    library: 'Research Library',
    architecture: 'Architecture',
  };

  return (
    <main className="main-content">
      <header className="top-bar">
        <div>
          <h1 className="top-bar-title">{titles[activeTab]}</h1>
          <div style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px'}}>
            {meta.name} • {meta.base_currency} • Inception {meta.inception_date}
          </div>
        </div>
        <div className="top-bar-meta">
          <Clock size={16} />
          Last Updated: {meta.last_updated}
        </div>
      </header>
      <div className="page-container">
        {children}
      </div>
    </main>
  );
}
