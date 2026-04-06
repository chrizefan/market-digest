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
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{flexShrink: 0}}>
            <defs>
              <clipPath id="atlas-globe-clip">
                <circle cx="20" cy="20" r="14"/>
              </clipPath>
            </defs>
            {/* Globe */}
            <circle cx="20" cy="20" r="14" stroke="white" strokeWidth="1.5"/>
            {/* Meridian */}
            <ellipse cx="20" cy="20" rx="6" ry="14" stroke="white" strokeWidth="1" opacity="0.35"/>
            {/* Equator */}
            <line x1="6" y1="20" x2="34" y2="20" stroke="white" strokeWidth="1" opacity="0.35"/>
            {/* Trend line */}
            <polyline
              points="9,27 15,20 20,23 27,13"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              clipPath="url(#atlas-globe-clip)"
            />
            {/* Peak dot */}
            <circle cx="27" cy="13" r="2" fill="white" clipPath="url(#atlas-globe-clip)"/>
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
