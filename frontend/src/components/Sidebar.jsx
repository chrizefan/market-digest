import { BarChart3, Target, BookOpen, Database, TrendingUp, PieChart } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'portfolio', label: 'Asset Allocation', icon: <PieChart size={20} /> },
    { id: 'performance', label: 'Performance Tracking', icon: <TrendingUp size={20} /> },
    { id: 'strategy', label: 'Strategy & Thesis', icon: <Target size={20} /> },
    { id: 'library', label: 'Research Library', icon: <BookOpen size={20} /> },
    { id: 'architecture', label: 'Architecture', icon: <Database size={20} /> },
  ];

  return (
    <aside className="sidebar">
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
            }}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
