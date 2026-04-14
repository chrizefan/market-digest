'use client';

import { Menu, X } from 'lucide-react';
import { useAppShell } from '@/components/app-shell-context';

/**
 * Replaces the floating hamburger: reserved top row so content is not covered on small screens.
 */
export default function MobileAppBar() {
  const { mobileNavOpen, toggleMobileNav } = useAppShell();

  return (
    <header className="sticky top-0 z-[997] flex min-h-12 shrink-0 items-stretch border-b border-border-subtle bg-bg-glass/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md md:hidden">
      <div className="grid w-full grid-cols-[2.75rem,minmax(0,1fr),2.75rem] items-center gap-1 px-2 py-2">
        <button
          type="button"
          onClick={toggleMobileNav}
          className="flex h-9 w-9 items-center justify-center self-center rounded-lg border border-border-subtle text-text-primary hover:bg-white/[0.06]"
          aria-expanded={mobileNavOpen}
          aria-controls="app-sidebar-nav"
          aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileNavOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
        </button>
        <div className="flex min-w-0 flex-col items-center justify-center text-center leading-tight">
          <span className="text-sm font-semibold tracking-tight text-text-primary">Atlas</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">Dashboard</span>
        </div>
        <span className="w-9 shrink-0" aria-hidden />
      </div>
    </header>
  );
}
