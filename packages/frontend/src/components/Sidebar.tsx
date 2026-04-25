'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Zap, Coins, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useBalance } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@crucible/shared';

const NAV_ITEMS = [
  { name: 'Arena',    href: '/',       icon: LayoutDashboard },
  { name: 'Agents',  href: '/agents', icon: Users },
  { name: 'Tasks',   href: '/tasks',  icon: Zap },
  { name: 'Stake',   href: '/stake',  icon: Coins },
  { name: 'Admin',   href: '/admin',  icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const { data: slashBalance } = useBalance({
    address: CONTRACT_ADDRESSES.SLASHING_JUDGE as `0x${string}`,
  });

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-[60] lg:hidden"
          onClick={onClose}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ x: isMobile ? (isOpen ? 0 : -176) : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-14 h-[calc(100vh-56px)] w-44 bg-surface-low border-r border-border flex flex-col z-[70]"
      >
        {/* Mobile close */}
        {isOpen && (
          <button
            onClick={onClose}
            className="lg:hidden absolute top-3 right-3 p-1 text-on-surface-muted hover:text-on-surface"
          >
            <X size={14} />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-mono uppercase tracking-widest transition-colors relative border-l-2',
                  isActive
                    ? 'border-primary bg-primary/8 text-primary'
                    : 'border-transparent text-on-surface-dim hover:text-on-surface-muted hover:bg-surface-container',
                )}
              >
                <item.icon
                  size={14}
                  className={cn('flex-shrink-0', isActive ? 'text-primary' : 'text-on-surface-dim')}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Slashed Treasury */}
        <div className="px-3 py-4 border-t border-border">
          <div className="px-3 py-3 border border-primary/20 bg-primary/5">
            <p className="text-[9px] font-mono uppercase tracking-widest text-primary/60 mb-1.5">
              Slashed Treasury
            </p>
            <div className="flex items-end gap-1">
              <span className="text-base font-mono font-bold text-primary">
                {slashBalance ? parseFloat(slashBalance.formatted).toFixed(3) : '0.000'}
              </span>
              <span className="text-[9px] font-mono text-primary/50 mb-0.5">0G</span>
            </div>
          </div>

          {/* Testnet indicator */}
          <div className="mt-2 flex items-center gap-1.5 px-1 overflow-hidden">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse flex-shrink-0" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-on-surface-dim truncate">
              Galileo
            </span>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
