import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Layout from './components/Layout';
import Portfolio from './pages/Portfolio';
import Performance from './pages/Performance';
import Strategy from './pages/Strategy';
import Library from './pages/Library';
import Architecture from './pages/Architecture';

function App() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}dashboard-data.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load data");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loader">Initializing Market Digest...</div>;
  }

  if (!data) {
    return <div className="loader" style={{color: 'var(--accent-red)'}}>Failed to load data. Run python update script.</div>;
  }

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <Layout activeTab={activeTab} meta={data.portfolio.meta}>
        {activeTab === 'portfolio' && <Portfolio data={data} />}
        {activeTab === 'performance' && <Performance data={data} />}
        {activeTab === 'strategy' && <Strategy data={data} />}
        {activeTab === 'library' && <Library docs={data.docs} />}
        {activeTab === 'architecture' && <Architecture />}
      </Layout>
    </div>
  );
}

export default App;
