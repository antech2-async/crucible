'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Zap, Coins, Settings, ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useBalance } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@crucible/shared';

const NAV_ITEMS = [
  { name: 'Arena',     href: '/',       icon: LayoutDashboard },
  { name: 'Agents',   href: '/agents', icon: Users },
  { name: 'Tasks',    href: '/tasks',  icon: Zap },
  { name: 'Staking',  href: '/stake',  icon: Coins },
  { name: 'Admin Hub',href: '/admin',  icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
        animate={{ x: isMobile ? (isOpen ? 0 : -264) : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-full w-64 bg-surface-low border-r border-border flex flex-col z-[70]"
      >
        {/* Brand */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary flex items-center justify-center">
              <span className="font-mono font-black text-primary text-[10px] leading-none">C</span>
            </div>
            <span className="font-display font-bold text-sm uppercase tracking-widest text-on-surface">
              Crucible
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-on-surface-muted hover:text-on-surface transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-xs font-display font-bold uppercase tracking-widest transition-colors relative group',
                  isActive
                    ? 'bg-primary/10 text-primary border-l-2 border-primary pl-[10px]'
                    : 'text-on-surface-muted hover:text-on-surface hover:bg-surface-container border-l-2 border-transparent pl-[10px]',
                )}
              >
                <item.icon
                  size={15}
                  className={cn(
                    'flex-shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-on-surface-dim group-hover:text-on-surface-muted',
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          <FooterLink icon={<ExternalLink size={12} />} label="0G Mainnet" href="https://0g.ai" />
          <FooterLink icon={<Settings size={12} />} label="Coordinator Config" href="#" />

          <div className="mt-3 px-3 py-3 border border-border bg-surface-container">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted">
                Galileo Testnet
              </span>
            </div>
            <p className="text-[9px] font-mono text-on-surface-dim truncate">
              evmrpc-testnet.0g.ai
            </p>
          </div>

          <div className="px-3 py-3 border border-primary/20 bg-primary/5">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-primary/70">
                Slashed Treasury
              </span>
              <div className="w-1 h-1 bg-primary" />
            </div>
            <div className="flex items-end gap-1">
              <span className="text-base font-mono font-bold text-primary">
                {slashBalance ? parseFloat(slashBalance.formatted).toFixed(3) : '0.000'}
              </span>
              <span className="text-[9px] font-mono text-primary/60 mb-0.5">0G</span>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function FooterLink({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-on-surface-dim hover:text-on-surface-muted transition-colors"
    >
      {icon} {label}
    </a>
  );
}
