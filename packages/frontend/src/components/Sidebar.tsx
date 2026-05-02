'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coins, FileText, HelpCircle, Settings, Swords, Terminal, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { name: 'Arena', href: '/', icon: Swords },
  { name: 'Agents', href: '/agents', icon: Users },
  { name: 'Tasks', href: '/tasks', icon: FileText },
  { name: 'Stake', href: '/stake', icon: Coins },
  { name: 'Docs', href: '/admin', icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-[60] bg-black/70 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          'fixed left-0 top-16 z-[70] flex h-[calc(100vh-64px)] w-56 flex-col border-r border-border-strong/15 bg-surface-low transition-transform duration-300 ease-out lg:z-40 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {isOpen && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-1 text-on-surface-muted hover:text-on-surface lg:hidden"
            aria-label="Close navigation"
          >
            <X size={14} />
          </button>
        )}

        <nav className="flex-1 space-y-1 pt-10">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'relative flex items-center gap-4 border-l-2 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.08em] transition-all duration-300',
                  isActive
                    ? 'border-primary bg-gradient-to-r from-primary/10 to-transparent text-primary'
                    : 'border-transparent text-on-surface/35 hover:bg-surface-container hover:text-on-surface',
                )}
              >
                <item.icon
                  size={16}
                  className={cn('shrink-0', isActive ? 'text-primary' : 'text-on-surface/35')}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-border-strong/10 px-6 py-6">
          <Link
            href="/admin"
            className="flex items-center gap-4 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-on-surface/35 transition-colors hover:text-primary"
          >
            <HelpCircle size={14} />
            Support
          </Link>
          <Link
            href="/tasks"
            className="flex items-center gap-4 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-on-surface/35 transition-colors hover:text-primary"
          >
            <Terminal size={14} />
            Logs
          </Link>
        </div>
      </aside>
    </>
  );
}
