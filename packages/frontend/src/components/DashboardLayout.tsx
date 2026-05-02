'use client';

import React, { useState } from 'react';
import { CircleUserRound, Menu, Settings } from 'lucide-react';
import Sidebar from './Sidebar';
import { ConnectWallet } from './ConnectWallet';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="fixed top-0 left-0 right-0 h-16 z-[100] flex items-center justify-between border-b border-border-strong/15 bg-surface/85 px-4 shadow-[0_24px_42px_-22px_rgba(230,226,223,0.16)] backdrop-blur-xl md:px-6">
        <div className="flex min-w-0 items-center gap-5 md:gap-8">
          <button
            className="p-1.5 text-on-surface-dim transition-colors hover:text-primary lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
              <span className="font-mono text-xs font-black text-primary">C</span>
            </div>
            <span className="max-w-[130px] truncate font-display text-lg font-black tracking-tight text-on-surface sm:max-w-none">
              SOLARIS_NODE
            </span>
          </div>
          <nav className="hidden items-center gap-2 md:flex">
            <a className="px-2 py-1 font-display text-sm font-semibold text-primary" href="/">
              Arena
            </a>
            <a
              className="px-2 py-1 font-display text-sm text-on-surface/55 transition-colors hover:bg-primary/10 hover:text-on-surface"
              href="/agents"
            >
              Agents
            </a>
            <a
              className="px-2 py-1 font-display text-sm text-on-surface/55 transition-colors hover:bg-primary/10 hover:text-on-surface"
              href="/tasks"
            >
              Tasks
            </a>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button className="hidden h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-surface-highest text-secondary/80 transition-colors hover:border-primary/50 md:flex">
            <CircleUserRound size={16} />
          </button>
          <button
            className="hidden p-2 text-on-surface/55 transition-colors hover:text-primary md:block"
            aria-label="Settings"
          >
            <Settings size={17} />
          </button>
          <ConnectWallet />
        </div>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="min-w-0 px-4 pb-20 pt-24 md:px-8 lg:ml-56">{children}</main>

      <footer className="fixed bottom-0 left-0 right-0 z-30 hidden items-center justify-between border-t border-border-strong/10 bg-surface/95 px-6 py-2 font-mono text-[10px] uppercase tracking-widest text-on-surface/30 backdrop-blur lg:left-56 lg:flex">
        <span>© 2026 Crucible Industrial Agents</span>
        <div className="flex items-center gap-7">
          <span className="font-bold text-secondary">Network: 42.5k TPS</span>
          <span>Protocol: v4.0.2</span>
          <span className="flex items-center gap-2 text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            Status: Operational
          </span>
        </div>
      </footer>
    </div>
  );
}
