import { Target, Clock, Database, TrendingUp, PieChart, Menu, X } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }) {
  const navItems = [
    { id: 'portfolio', label: 'Asset Allocation', icon: <PieChart size={20} /> },
    { id: 'performance', label: 'Performance Tracking', icon: <TrendingUp size={20} /> },
    { id: 'strategy', label: 'Strategy & Thesis', icon: <Target size={20} /> },
    { id: 'library', label: 'File Timeline', icon: <Clock size={20} /> },
    { id: 'architecture', label: 'Architecture', icon: <Database size={20} /> },
  ];

  return (
    <>
      <button className="hamburger-btn" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{flexShrink: 0}}>
            <defs>
              <clipPath id="atlas-globe-clip">
                <circle cx="20" cy="20" r="14.5"/>
              </clipPath>
            </defs>
            {/* Globe outline */}
            <circle cx="20" cy="20" r="14.5" stroke="#f59e0b" strokeWidth="1.5"/>
            {/* Center meridian */}
            <ellipse cx="20" cy="20" rx="6.5" ry="14.5" stroke="#f59e0b" strokeWidth="0.9" opacity="0.45"/>
            {/* Equator */}
            <line x1="5.5" y1="20" x2="34.5" y2="20" stroke="#f59e0b" strokeWidth="0.9" opacity="0.45"/>
            {/* Upper latitude */}
            <ellipse cx="20" cy="13.5" rx="12" ry="2.4" stroke="#f59e0b" strokeWidth="0.7" opacity="0.3"/>
            {/* Lower latitude */}
            <ellipse cx="20" cy="26.5" rx="12" ry="2.4" stroke="#f59e0b" strokeWidth="0.7" opacity="0.3"/>
            {/* Chart trend line — clipped to globe */}
            <polyline
              points="8,29 13,22 18,25 23,16 32,19"
              stroke="#e6e6e6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              clipPath="url(#atlas-globe-clip)"
            />
            {/* Peak marker */}
            <circle cx="23" cy="16" r="2.2" fill="#f59e0b"/>
          </svg>
          <span>digiquant-atlas</span>
        </div>
        <nav>
          {navItems.map((item) => (
            <a
              key={item.id}
              className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(item.id);
                setIsOpen(false);
              }}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
}
