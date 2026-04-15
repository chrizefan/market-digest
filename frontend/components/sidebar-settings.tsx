'use client';

import { useEffect, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import { useAppShell } from '@/components/app-shell-context';
import { SettingsContent } from '@/components/settings-content';

export default function SidebarSettings({ sidebarCollapsed }: { sidebarCollapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { setMobileNavOpen } = useAppShell();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Settings"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`
          flex items-center gap-3 w-full rounded-lg py-3 text-sm font-medium transition-colors
          text-text-secondary hover:text-text-primary hover:bg-white/[0.03]
          ${sidebarCollapsed ? 'md:justify-center md:px-3' : 'px-3'}
          ${open ? 'bg-white/[0.06] text-text-primary' : ''}
        `}
      >
        <Settings size={20} className="shrink-0" />
        <span className={sidebarCollapsed ? 'md:sr-only' : ''}>Settings</span>
      </button>

      {open ? (
        <div
          className={`
            absolute z-[1100] w-[min(100vw-2rem,280px)] rounded-xl border border-border-subtle bg-bg-glass backdrop-blur-xl shadow-glass p-4
            ${sidebarCollapsed ? 'left-full ml-2 bottom-0' : 'left-0 bottom-full mb-2'}
          `}
          role="dialog"
          aria-label="Settings"
        >
          <SettingsContent
            onNavigate={() => {
              setOpen(false);
              setMobileNavOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
