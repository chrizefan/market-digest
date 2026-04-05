import React from 'react';
import { Network, Database, BrainCircuit, Activity, LineChart, Cpu, FileText, CheckCircle2 } from 'lucide-react';

export default function Architecture() {
  const phases = [
    {
      title: 'Phase 1: Alternative Data & Signals',
      icon: <Activity color="var(--accent-purple)" />,
      desc: 'Runs FIRST. Extracts sentiment, positioning, and institutional flows to color the macro/segment reads.',
      subtext: 'Skills: Sentiment, CTA Positioning, Options/Derivatives, Politician Signals'
    },
    {
      title: 'Phase 2: Institutional Intelligence',
      icon: <Database color="var(--accent-blue)" />,
      desc: 'Tracks real capital flows across ETFs, dark pools, 13D/13G filings, and 16 tracked Hedge Funds.',
      subtext: 'Skills: Institutional Flows, Hedge Fund Intel'
    },
    {
      title: 'Phase 3: Macro Regime Classification',
      icon: <BrainCircuit color="var(--accent-amber)" />,
      desc: 'Anchors all downstream analysis. Identifies the 4-factor macro regime (Growth, Inflation, Policy, Risk Appetite).',
      subtext: 'Skills: Macro Analysis (v2)'
    },
    {
      title: 'Phase 4: Asset Classes',
      icon: <LineChart color="var(--accent-green)" />,
      desc: 'Runs dedicated reads on risk-strata assets checking alignment against the macro regime output.',
      subtext: 'Skills: Bonds, Commodities, Forex, Crypto, International/EM'
    },
    {
      title: 'Phase 5: US Equities & Sector Swarm',
      icon: <Network color="var(--accent-blue)" />,
      desc: 'Top-down market breadth and factor analysis, followed by delegating to 11 individual GICS Sector Sub-Agents.',
      subtext: 'Skills: US Equities + 11 Dedicated Sector Skills'
    },
    {
      title: 'Phase 6: Memory & Bias Tracker',
      icon: <Cpu color="var(--accent-purple)" />,
      desc: 'Updates the 23 rolling memory state logs and appends a row to the master BIAS-TRACKER database.',
      subtext: 'Updates all ROLLING.md files'
    },
    {
      title: 'Phase 7: Synthesis (DIGEST.md)',
      icon: <FileText color="var(--accent-green)" />,
      desc: 'Synthesizes all 21 raw segment files into a coherent, actionable brief and portfolio target allocation.',
      subtext: 'Output: DIGEST.md'
    }
  ];

  const agentSwarm = [
    { name: "Alternative Data", count: 4, skills: ["Sentiment & News", "CTA & Cot", "Options (GEX, VIX)", "Politician Trades"] },
    { name: "Institutional", count: 2, skills: ["ETF/Dark Pools", "Hedge Fund 13F"] },
    { name: "Core Macro/Assets", count: 6, skills: ["Macro", "Bonds", "Commodities", "Forex", "Crypto", "International"] },
    { name: "US Equities", count: 12, skills: ["Broad Market", "Technology", "Healthcare ★", "Energy ★", "Financials", "Staples ★", "Discretionary", "Industrials", "Utilities", "Materials", "Real Estate", "Comms"] },
  ];

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 className="text-h2">Pipeline Architecture & Agent Swarm</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.6 }}>
          This page documents the 7-phase automated pipeline and AI architecture powering the Market Digest.
          To ensure complete transparency, every step from raw data ingestion to final portfolio weights is mapped below.
        </p>
      </div>

      <div className="grid-2" style={{ gap: '24px' }}>
        
        {/* Left Column: Timeline */}
        <div className="glass-card" style={{ padding: '32px 24px' }}>
          <h3 className="text-h3" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network color="var(--accent-blue)" /> The 7-Phase Orchestrator
          </h3>
          
          <div className="timeline-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
            {/* Timeline structural line */}
            <div style={{ position: 'absolute', left: '23px', top: '24px', bottom: '24px', width: '2px', background: 'rgba(255,255,255,0.05)', zIndex: 0 }}></div>
            
            {phases.map((phase, index) => (
              <div key={index} style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-card)', 
                  border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                }}>
                  {phase.icon}
                </div>
                <div style={{ paddingTop: '4px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {phase.title}
                  </h4>
                  <p style={{ fontSize: '0.95rem', color: '#a1a1aa', lineHeight: 1.5, marginBottom: '6px' }}>
                    {phase.desc}
                  </p>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontFamily: 'monospace', background: 'rgba(59,130,246,0.1)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                    {phase.subtext}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Details  */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Portfolio Decoupling Detail */}
          <div className="glass-card">
            <h3 className="text-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BrainCircuit color="var(--accent-purple)" /> Dynamic Generation
            </h3>
            <p style={{ color: '#a1a1aa', lineHeight: 1.6, marginBottom: '16px' }}>
              This platform uses a completely decoupled architecture. There are no static databases. The backend Python engine parses the daily Markdown <code>DIGEST.md</code> outputs chronologically, interprets the Target Allocation statements, fetches Yahoo Finance market data, and recreates the exact theoretical portfolio performance dynamically.
            </p>
            <ul style={{ paddingLeft: '20px', color: 'var(--accent-green)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem' }}>
              <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><CheckCircle2 size={16}/> Extract Tickers & Weights via Regex</li>
              <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><CheckCircle2 size={16}/> Fetch T+0 historical closes via yfinance</li>
              <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><CheckCircle2 size={16}/> Simulate daily NAV tracking starting April 5, 2026</li>
            </ul>
          </div>

          {/* Sub Agents Grids */}
          <div className="glass-card">
            <h3 className="text-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu color="var(--accent-amber)" /> The Sub-Agent Swarm
            </h3>
            <p style={{ color: '#a1a1aa', lineHeight: 1.6, marginBottom: '20px', fontSize: '0.95rem' }}>
              The orchestration pipeline branches out to 22+ specialized sub-agent prompts. Each skill file is isolated, reads from its own rolling memory state, and executes highly concentrated research.
            </p>
            
            <div className="grid-2" style={{ gap: '16px' }}>
              {agentSwarm.map((swarm, i) => (
                <div key={i} style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{swarm.name}</span>
                    <span style={{ background: 'var(--border-subtle)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600}}>
                      {swarm.count} Agents
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {swarm.skills.map((skill, j) => (
                      <span key={j} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#d4d4d8' }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#71717a', textAlign: 'right' }}>
              ★ denotes an active portfolio holding context.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
