'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CircleUserRound, Menu, Settings } from 'lucide-react';
import Sidebar from './Sidebar';
import { ConnectWallet } from './ConnectWallet';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="fixed top-0 left-0 right-0 h-16 z-[100] flex items-center justify-between border-b border-border-strong/15 bg-surface/85 px-4 shadow-[0_24px_42px_-22px_rgba(230,226,223,0.16)] backdrop-blur-xl md:px-6">
        <div className="flex min-w-0 items-center gap-4 md:gap-6">
          <button
            className="p-1.5 text-on-surface-dim transition-colors hover:text-primary lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3"
            aria-label="Crucible home"
          >
            <CrucibleLogoMark />
            <span className="flex min-w-0 flex-col leading-none">
              <span className="font-display text-lg font-black text-on-surface sm:text-xl">
                CRUCIBLE
              </span>
              <span className="hidden pt-1 font-mono text-[8px] uppercase tracking-[0.28em] text-primary/70 sm:block">
                Agent Trust Layer
              </span>
            </span>
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-border-strong/20 bg-surface-low/80 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-on-surface-dim lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary shadow-[0_0_12px_rgba(113,215,205,0.75)]" />
            0G Galileo Testnet
          </div>
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

function CrucibleLogoMark() {
  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-primary/25 bg-[linear-gradient(145deg,rgba(255,176,0,0.22),rgba(32,31,30,0.92)_58%,rgba(113,215,205,0.16))] shadow-[0_0_0_1px_rgba(255,213,151,0.05),0_18px_32px_-24px_rgba(255,176,0,0.8)] transition-all duration-300 group-hover:border-primary/60 group-hover:shadow-[0_0_0_1px_rgba(255,176,0,0.18),0_20px_38px_-22px_rgba(255,176,0,0.95)]">
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(255,213,151,0.26),transparent_32%)] opacity-80" />
      <svg
        viewBox="0 0 40 40"
        aria-hidden="true"
        className="relative h-8 w-8 text-primary transition-transform duration-300 group-hover:scale-105"
      >
        <path
          d="M20 3.8 33.9 11.9v16.2L20 36.2 6.1 28.1V11.9L20 3.8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          opacity="0.95"
        />
        <path
          d="M20 10.3c-4.5 1.9-6.8 4.9-6.8 8.9 0 4.7 3.2 7.9 7.5 7.9 3.2 0 5.8-1.7 7.1-4.6h-5.1c-.6.6-1.3.9-2.2.9-2 0-3.3-1.6-3.3-4.1 0-2.4 1.3-4.1 3.3-4.1 1 0 1.8.4 2.4 1.1h5C26.8 13 24.1 10.9 20 10.3Z"
          fill="currentColor"
        />
        <path
          d="M24.6 6.8 17 20.3h5.4L15.8 33"
          fill="none"
          stroke="rgb(var(--secondary))"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
      </svg>
    </span>
  );
}
