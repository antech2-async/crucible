'use client';

import React, { useState } from 'react';
import { Settings, Bell, Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import { ConnectWallet } from './ConnectWallet';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface">
      {/* Top bar — full width, fixed */}
      <header className="fixed top-0 left-0 right-0 h-14 z-[100] bg-surface-low border-b border-border flex items-center justify-between px-5">
        <div className="flex items-center gap-4">
          {/* Mobile menu */}
          <button
            className="lg:hidden p-1 text-on-surface-muted hover:text-on-surface transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={16} />
          </button>
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 border-2 border-primary flex items-center justify-center">
              <span className="font-mono font-black text-primary text-[10px] leading-none">C</span>
            </div>
            <span className="font-display font-bold text-sm uppercase tracking-widest text-on-surface">
              CRUCIBLE
            </span>
          </div>
          {/* Chain badge */}
          <span className="hidden sm:inline-flex text-[9px] font-mono uppercase tracking-widest text-on-surface-dim border border-border px-2 py-0.5">
            0G Galileo
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-on-surface-dim hover:text-on-surface-muted transition-colors">
            <Bell size={15} />
          </button>
          <button className="p-2 text-on-surface-dim hover:text-on-surface-muted transition-colors">
            <Settings size={15} />
          </button>
          <ConnectWallet />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 pt-14">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 min-w-0 lg:pl-44 p-6 md:p-8 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
