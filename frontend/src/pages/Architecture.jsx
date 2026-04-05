import React, { useState } from 'react';
import { Network, Database, BrainCircuit, Activity, LineChart, Cpu, FileText, CheckCircle2, Sparkles, ChevronDown, ChevronUp, Calendar, Zap, Clock } from 'lucide-react';

export default function Architecture({ data }) {
  const evolution = data?.evolution || {};
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (key) => {
    setExpandedSection(expandedSection === key ? null : key);
  };

  const cadenceTiers = [
    {
      label: 'Sunday',
      name: 'Weekly Baseline',
      icon: <Calendar size={20} />,
      color: 'var(--accent-blue)',
      desc: 'Full 9-phase run. Every segment re-analyzed from scratch. 28+ output files.',
      cost: '100% token budget',
      costColor: 'var(--accent-amber)',
    },
    {
      label: 'Mon – Sat',
      name: 'Daily Delta',
      icon: <Zap size={20} />,
      color: 'var(--accent-green)',
      desc: 'Triage-first. Mandatory segments always run; others only if threshold crossed.',
      cost: '~25–30% token budget',
      costColor: 'var(--accent-green)',
    },
    {
      label: 'Month-End',
      name: 'Monthly Synthesis',
      icon: <Clock size={20} />,
      color: 'var(--text-secondary)',
      desc: 'Cross-week regime review, thesis win/loss record, portfolio evolution summary.',
      cost: '~45% token budget',
      costColor: 'var(--text-secondary)',
    },
  ];

  const phases = [
    {
      num: '1',
      title: 'Alternative Data & Positioning',
      color: 'var(--accent-blue)',
      desc: 'Runs FIRST. Positioning intelligence must color all downstream reads — never read macro before knowing what the crowd is actually doing.',
      subPhases: ['1A — Sentiment & News (AAII, Fear/Greed, social)', '1B — CTA Positioning (COT, futures OI, flow models)', '1C — Options & Derivatives (GEX, VIX structure, dealer pos.)', '1D — Politician Signals (STOCK Act filings)'],
      outputs: 'alt-data/sentiment-news.md, cta-positioning.md, options-derivatives.md, politician-signals.md',
      memory: '4 alternative-data ROLLING.md',
    },
    {
      num: '2',
      title: 'Institutional Intelligence',
      color: 'var(--accent-blue)',
      desc: 'Smart money reads. ETF flows, dark pool prints, 16 tracked hedge fund signals.',
      subPhases: ['2A — Institutional Flows (ETF in/out, dark pools, 13D/13G/Form 4)', '2B — Hedge Fund Intel (13F filings, X posts, 16 tracked CIKs)'],
      outputs: 'institutional-flows.md, hedge-fund-intel.md',
      memory: '2 institutional ROLLING.md',
    },
    {
      num: '3',
      title: 'Macro Regime Classification',
      color: 'var(--accent-amber)',
      desc: 'The analytical anchor. Every Phase 4–5 analysis must reference this regime output. Identifies the 4-factor regime.',
      subPhases: ['Growth factor — GDP trend, PMI, labor, earnings revisions', 'Inflation factor — CPI/PPI trajectory, commodity pressures, breakevens', 'Policy factor — Fed/ECB/BOJ stance, rate trajectory, QT pace', 'Risk Appetite — VIX structure, credit spreads, EM flows'],
      outputs: 'macro.md (regime label + portfolio implications)',
      memory: 'macro/ROLLING.md',
    },
    {
      num: '4',
      title: 'Asset Class Analysis',
      color: 'var(--accent-green)',
      desc: 'Five parallel asset-class agents, each checking alignment against the Phase 3 macro regime.',
      subPhases: ['4A — Bonds (yield curve, real rates, TIPS, IG/HY spreads)', '4B — Commodities (WTI, Gold, Copper, ag, OPEC+ signals)', '4C — Forex (DXY, EUR/USD, USD/JPY, carry trade)', '4D — Crypto (BTC, ETH, funding rates, on-chain)', '4E — International/EM (Asia, Europe, EM FX, geo-risk)'],
      outputs: 'bonds.md, commodities.md, forex.md, crypto.md, international.md',
      memory: '5 asset-class ROLLING.md',
    },
    {
      num: '5',
      title: 'US Equities + 11-Sector Swarm',
      color: 'var(--accent-blue)',
      desc: 'Top-down breadth and factor analysis, then 11 specialized GICS sector sub-agents run sequentially.',
      subPhases: ['5A — Market Breadth (SPY/QQQ/IWM, A/D line, new highs/lows, factors)', '5B-5L — 11 GICS sector agents (XLK, XLV, XLE, XLF, XLP, XLY, XLI, XLU, XLB, XLRE, XLC)', '5M — Sector Scorecard synthesis (OW/UW/N × confidence × key driver)'],
      outputs: 'us-equities.md, sectors/{11 files}',
      memory: 'equity/ROLLING.md + 11 sector ROLLING.md',
    },
    {
      num: '6',
      title: 'Memory Consolidation & Bias Tracker',
      color: 'var(--text-primary)',
      desc: 'System-wide memory commit after all research is complete. Append to all 25 files and update the master bias table.',
      subPhases: ['6A — BIAS-TRACKER.md row: 14 columns incl. macro regime, each asset class bias, inst. flow, CTA, HF consensus', '6B — Confirm all 25 ROLLING.md files appended this session'],
      outputs: 'memory/BIAS-TRACKER.md (new row)',
      memory: 'All 25 memory files appended',
    },
    {
      num: '7',
      title: 'Master Synthesis: DIGEST.md',
      color: 'var(--accent-green)',
      desc: 'Synthesis — not regurgitation. Pull the most important signals from all 20+ segments into one coherent, actionable brief.',
      subPhases: ['7 — Market regime snapshot + alt data + institutional + macro + asset classes + equities', '7 — Thesis tracker (✅ Confirmed / ⚠️ Conflicted / ❌ Challenged / ⏳ No signal)', '7C — Asset Analyst Pass: per-ticker conviction scores, blinded to portfolio weights', '7D — Portfolio Manager: clean-slate target → rebalance diff (Hold/Add/Trim/Exit/New)'],
      outputs: 'DIGEST.md, positions/{TICKER}.md, portfolio-recommended.md, rebalance-decision.md',
      memory: 'portfolio/ROLLING.md',
    },
    {
      num: '8',
      title: 'Web Dashboard Regeneration',
      color: 'var(--accent-amber)',
      desc: 'Python backend parses all DIGEST.md files, fetches Yahoo Finance closes, simulates NAV, writes dashboard-data.json.',
      subPhases: ['Run: python3 scripts/update-tearsheet.py', 'Extract Target Allocation tables via regex', 'Simulate daily NAV from first entry date', 'Commit: ./scripts/git-commit.sh (digest commit)'],
      outputs: 'frontend/public/dashboard-data.json → React app at digiquant.io',
      memory: '—',
    },
    {
      num: '9',
      title: 'Post-Mortem & Evolution',
      color: '#f472b6',
      desc: 'Self-improvement loop. Rate sources, check prediction accuracy, file max 2 proposals. Never auto-applies — requires PR approval.',
      subPhases: ['9A — Source Scorecard (1–5 stars per source, failures, discoveries)', '9B — Quality Post-Mortem (prediction accuracy ✅/❌, 5-dimension quality score)', '9C — Improvement Proposals (max 2/session; locked: schema, risk profile, guardrails)', '9D/9E — Document approved changes + evolution branch + PR'],
      outputs: 'memory/evolution/sources.md, quality-log.md, proposals.md',
      memory: 'evolution-changelog.md',
    },
  ];

  const agentSwarm = [
    { name: "Alternative Data", count: 4, skills: ["Sentiment & News", "CTA & COT", "Options (GEX, VIX)", "Politician Trades"] },
    { name: "Institutional", count: 2, skills: ["ETF/Dark Pools", "Hedge Fund 13F"] },
    { name: "Macro & Assets", count: 6, skills: ["Macro (4-factor)", "Bonds", "Commodities", "Forex", "Crypto", "International/EM"] },
    { name: "US Equities", count: 12, skills: ["Broad Market", "Technology", "Healthcare", "Energy", "Financials", "Staples", "Discretionary", "Industrials", "Utilities", "Materials", "Real Estate", "Comms"] },
    { name: "Portfolio Layer", count: 2, skills: ["Asset Analyst (Phase 7C)", "Portfolio Manager (Phase 7D)"] },
  ];

  const evolutionSections = [
    { key: 'changelog', title: 'Evolution Changelog', desc: 'All approved and applied pipeline improvements', icon: '📋' },
    { key: 'proposals', title: 'Pending Proposals', desc: 'Improvement proposals awaiting review', icon: '💡' },
    { key: 'quality_log', title: 'Quality Post-Mortems', desc: 'Daily self-assessment and prediction tracking', icon: '🔍' },
    { key: 'sources', title: 'Source Scorecard', desc: 'Data source reliability ratings', icon: '🌐' },
  ];

  const renderMarkdown = (md) => {
    if (!md) return <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No data yet — will populate after the first digest run.</p>;
    return (
      <pre style={{
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: "'Space Mono', monospace",
        fontSize: '0.8rem',
        color: '#d4d4d8',
        lineHeight: 1.7,
        maxHeight: '400px',
        overflowY: 'auto',
        padding: '16px',
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)'
      }}>
        {md}
      </pre>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 className="text-h2">Pipeline Architecture</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.6 }}>
          9-phase AI orchestrator with a three-tier cadence — full baseline on Sundays, lightweight delta Mon–Sat, monthly synthesis at month-end.
        </p>
      </div>

      {/* Three-Tier Cadence */}
      <div style={{ marginBottom: '32px' }}>
        <h3 className="text-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--text-secondary)" /> Three-Tier Cadence
        </h3>
        <div className="grid-3" style={{ gap: '16px' }}>
          {cadenceTiers.map((tier, i) => (
            <div key={i} className="glass-card" style={{ padding: '20px', borderLeft: `2px solid ${tier.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: tier.color }}>{tier.icon}</span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace", letterSpacing: '0.05em' }}>{tier.label}</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>{tier.name}</div>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>{tier.desc}</p>
              <div style={{ fontSize: '0.75rem', color: tier.costColor, fontFamily: "'Space Mono', monospace" }}>{tier.cost}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase Timeline + Agent Swarm */}
      <div className="grid-2" style={{ gap: '24px', marginBottom: '32px' }}>

        {/* Left: Phase Timeline */}
        <div className="glass-card" style={{ padding: '28px 24px' }}>
          <h3 className="text-h3" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={18} color="var(--accent-blue)" /> The 9-Phase Orchestrator
          </h3>

          <div style={{ position: 'relative' }}>
            {/* Timeline spine */}
            <div style={{ position: 'absolute', left: '19px', top: '20px', bottom: '20px', width: '1px', background: 'var(--border-subtle)', zIndex: 0 }} />

            {phases.map((phase, index) => {
              const isEvo = phase.num === '9';
              return (
                <div key={index} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1, marginBottom: index < phases.length - 1 ? '24px' : '0' }}>
                  {/* Phase number bubble */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${isEvo ? 'rgba(244,114,182,0.3)' : 'var(--border-subtle)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.75rem', fontWeight: 700,
                    color: phase.color,
                  }}>
                    {phase.num}
                  </div>

                  <div style={{ paddingTop: '6px', flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {phase.title}
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>
                      {phase.desc}
                    </p>
                    {/* Sub-phases */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '8px' }}>
                      {phase.subPhases.map((sp, j) => (
                        <div key={j} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '8px', borderLeft: `2px solid ${phase.color}22` }}>
                          {sp}
                        </div>
                      ))}
                    </div>
                    {/* Output badge */}
                    <div style={{
                      fontSize: '0.72rem',
                      color: isEvo ? '#f472b6' : phase.color,
                      fontFamily: "'Space Mono', monospace",
                      background: isEvo ? 'rgba(244,114,182,0.08)' : `${phase.color}12`,
                      border: `1px solid ${isEvo ? 'rgba(244,114,182,0.2)' : `${phase.color}25`}`,
                      padding: '3px 8px', borderRadius: '4px', display: 'inline-block',
                      maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
                      wordBreak: 'break-word', whiteSpace: 'normal',
                    }}>
                      {phase.outputs}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Dynamic Backend + Agent Swarm */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Backend Architecture */}
          <div className="glass-card">
            <h3 className="text-h3" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BrainCircuit size={18} color="var(--accent-blue)" /> Dynamic Generation
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px', fontSize: '0.88rem' }}>
              No static database. No backend server. The Python engine parses all <code>DIGEST.md</code> outputs chronologically, extracts Target Allocation tables via regex, fetches Yahoo Finance historical closes, and simulates daily NAV tracking.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                'DIGEST.md files (structured Markdown)',
                'update-tearsheet.py (Python parser)',
                'dashboard-data.json (frontend/public/)',
                'React app at digiquant.io (static site)',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                  <CheckCircle2 size={13} color="var(--accent-green)" />
                  <span style={{ color: i === 0 || i === 3 ? 'var(--text-primary)' : 'var(--text-secondary)', fontFamily: i === 1 || i === 2 ? "'Space Mono', monospace" : 'inherit' }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Swarm */}
          <div className="glass-card">
            <h3 className="text-h3" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="var(--accent-amber)" /> Sub-Agent Swarm
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px', fontSize: '0.85rem' }}>
              26 specialized sub-agent skill files. Each is isolated, reads its own rolling memory, and executes concentrated domain research.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {agentSwarm.map((group, i) => (
                <div key={i} style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{group.name}</span>
                    <span style={{ background: 'var(--border-subtle)', padding: '2px 7px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: "'Space Mono', monospace" }}>
                      {group.count}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {group.skills.map((skill, j) => (
                      <span key={j} style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border-subtle)',
                        padding: '3px 7px', borderRadius: '3px',
                        fontSize: '0.7rem', color: 'var(--text-secondary)'
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Memory Stats */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 className="text-h3" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="var(--text-secondary)" /> Memory System
            </h3>
            <div className="grid-2 grid-2-keep" style={{ gap: '10px' }}>
              {[
                { label: 'ROLLING.md files', value: '23', color: 'var(--accent-blue)' },
                { label: 'Tracked sectors', value: '11', color: 'var(--accent-green)' },
                { label: 'Alt data streams', value: '4', color: 'var(--accent-amber)' },
                { label: 'Outputs / baseline', value: '28+', color: 'var(--text-primary)' },
              ].map((stat, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color, fontFamily: "'Space Mono', monospace" }}>{stat.value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Evolution Section */}
      <div>
        <div style={{ marginBottom: '20px' }}>
          <h2 className="text-h2" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={22} color="#f472b6" /> Pipeline Evolution
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.6, fontSize: '0.9rem' }}>
            Phase 9 runs a post-mortem after every session — rating sources, checking prediction accuracy, and filing max 2 improvement proposals.
            All changes require explicit PR approval before merging to <code>master</code>.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {evolutionSections.map((section) => {
            const isOpen = expandedSection === section.key;
            const content = evolution[section.key];
            return (
              <div key={section.key} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div
                  onClick={() => toggleSection(section.key)}
                  style={{
                    padding: '18px 22px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isOpen ? 'rgba(255,255,255,0.02)' : 'transparent',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{section.icon}</span> {section.title}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{section.desc}</p>
                  </div>
                  <div style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: '16px' }}>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
                {isOpen && (
                  <div style={{ padding: '0 22px 22px 22px', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ marginTop: '14px' }}>
                      {renderMarkdown(content)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
