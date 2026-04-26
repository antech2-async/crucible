'use client';

import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-surface text-on-surface overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        {/* Mobile top bar */}
        <header className="lg:hidden h-14 bg-surface-low border-b border-border flex items-center justify-between px-5 sticky top-0 z-[55] w-full">
          <div className="flex items-center gap-3">
            <div className="w-6 h-px bg-primary" />
            <span className="font-display font-bold text-sm uppercase tracking-widest text-on-surface">
              Crucible
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-on-surface-muted hover:text-on-surface transition-colors"
          >
            <Menu size={18} />
          </button>
        </header>

        <main className="flex-1 p-6 md:p-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
