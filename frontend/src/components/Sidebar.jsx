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
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{flexShrink: 0}}>
            <path stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              d="M4.2774,32.5293a11.6485,11.6485,0,0,1,23.2219,1.32h0c0,3.2166.0022,11.6479.0022,11.6479"/>
            <path stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              d="M3.3047,29.8574q-.0277-.4816-.0279-.97a16.61,16.61,0,1,1,33.2209,0v0c0,4.5869.0031,16.6095.0031,16.6095"/>
            <circle stroke="white" strokeWidth="2" cx="16.5007" cy="33.4992" r="5.0328"/>
            <path stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              d="M45.5,24A21.5,21.5,0,1,0,24,45.5H45.5Z"/>
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
