'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, PieChart, TrendingUp, Target, Clock,
  Database, Menu, X,
} from 'lucide-react';

const NAV = [
  { href: '/',              label: 'Overview',           icon: LayoutDashboard },
  { href: '/portfolio',     label: 'Asset Allocation',   icon: PieChart },
  { href: '/performance',   label: 'Performance',        icon: TrendingUp },
  { href: '/strategy',      label: 'Strategy & Thesis',  icon: Target },
  { href: '/library',       label: 'Research Library',   icon: Clock },
  { href: '/architecture',  label: 'Architecture',       icon: Database },
];

export default function Sidebar() {
  const pathname = usePathname();
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-[1001] flex items-center justify-center p-2 rounded-lg border border-border-subtle bg-bg-glass backdrop-blur-[12px] text-text-primary md:hidden"
        aria-label="Toggle menu"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-[999] md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-[260px] bg-bg-glass backdrop-blur-[12px] border-r border-border-subtle
          flex flex-col shrink-0
          fixed top-0 left-0 h-screen z-[1000] transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:relative md:z-auto
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border-subtle">
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none" aria-hidden="true" className="shrink-0">
            <path stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M4.2774,32.5293a11.6485,11.6485,0,0,1,23.2219,1.32h0c0,3.2166.0022,11.6479.0022,11.6479" />
            <path stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M3.3047,29.8574q-.0277-.4816-.0279-.97a16.61,16.61,0,1,1,33.2209,0v0c0,4.5869.0031,16.6095.0031,16.6095" />
            <circle stroke="white" strokeWidth="2" cx="16.5007" cy="33.4992" r="5.0328" />
            <path stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M45.5,24A21.5,21.5,0,1,0,24,45.5H45.5Z" />
          </svg>
          <span className="text-base font-medium tracking-tight">digiquant-atlas</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const fullHref = `${base}${href}`;
            const isActive = pathname === fullHref || pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all
                  ${isActive
                    ? 'text-text-primary bg-white/[0.04] border-r-2 border-text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
                  }
                `}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
