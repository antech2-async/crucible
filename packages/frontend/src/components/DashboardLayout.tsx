'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-[#020617] text-white overflow-x-hidden">
      {/* Sidebar - Desktop fixed, Mobile drawer */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        {/* Mobile Top Header */}
        <header className="lg:hidden h-16 glass border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-[55] w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center glow-blue">
              <span className="font-black text-white italic text-xs">C</span>
            </div>
            <span className="font-black tracking-tighter text-lg uppercase italic mt-0.5">
              Crucible
            </span>
          </div>

          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Content Page */}
        <main className="flex-1 p-6 md:p-8 lg:p-12 relative min-h-screen">
          {/* Ambient Glows */}
          <div className="fixed top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-600/10 blur-[120px] -z-10 pointer-events-none" />
          <div className="fixed bottom-0 left-[20%] w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-purple-600/5 blur-[100px] -z-10 pointer-events-none" />

          {children}
        </main>
      </div>
    </div>
  );
}
