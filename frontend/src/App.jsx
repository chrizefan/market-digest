import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Layout from './components/Layout';
import Portfolio from './pages/Portfolio';
import Performance from './pages/Performance';
import Strategy from './pages/Strategy';
import DigestTimeline from './pages/DigestTimeline';
import Architecture from './pages/Architecture';

// Starfield canvas — mirrors digithings.ai background animation
function useStarfield() {
  useEffect(() => {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height, animId;

    const N = 180;
    const stars = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(),
      d: Math.random(), ph: Math.random() * Math.PI * 2,
    }));

    const init = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', init);
    init();

    const draw = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);
      for (const s of stars) {
        s.ph += 0.01 + s.d * 0.015;
        const tw = 0.6 + 0.4 * Math.sin(s.ph);
        const r = 0.35 + s.d * 1.1;
        const o = 0.2 + s.d * 0.55 * tw;
        ctx.beginPath();
        ctx.fillStyle = `rgba(230,230,230,${o})`;
        ctx.arc(s.x * width, s.y * height, r, 0, Math.PI * 2);
        ctx.fill();
        s.y -= 0.00015 + s.d * 0.0002;
        if (s.y < 0) s.y = 1;
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animId);
    };
  }, []);
}

function App() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useStarfield();

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}dashboard-data.json?v=${Date.now()}`)
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
    return <div className="loader">initializing digiquant-atlas_</div>;
  }

  if (!data) {
    return <div className="loader" style={{color: 'var(--accent-red)'}}>Failed to load data. Run python update script.</div>;
  }

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <Layout activeTab={activeTab} meta={data.portfolio.meta}>
        {activeTab === 'portfolio' && <Portfolio data={data} />}
        {activeTab === 'performance' && <Performance data={data} />}
        {activeTab === 'strategy' && <Strategy data={data} />}
        {activeTab === 'library' && <DigestTimeline docs={data.docs} />}
        {activeTab === 'architecture' && <Architecture data={data} />}
      </Layout>
    </div>
  );
}

export default App;
