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
          digiquant-atlas
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
