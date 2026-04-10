'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Zap, Coins, Settings, ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { name: 'Arena', href: '/', icon: LayoutDashboard },
  { name: 'Agents', href: '/agents', icon: Users },
  { name: 'Tasks', href: '/tasks', icon: Zap },
  { name: 'Staking', href: '/stake', icon: Coins },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={onClose}
        />
      )}

      <motion.aside
        initial={false}
        animate={{
          x: isMobile ? (isOpen ? 0 : -264) : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed left-0 top-0 h-full w-64 glass border-r border-white/5 flex flex-col z-[70] shadow-2xl lg:shadow-none',
          !isMobile && 'translate-x-0',
        )}
      >
        {/* Brand Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center glow-blue">
              <span className="font-black text-white italic text-xs">C</span>
            </div>
            <span className="font-black tracking-tighter text-xl uppercase italic">Crucible</span>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 mt-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden active:scale-95',
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[inset_0_0_10px_rgba(59,130,246,0.05)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5',
                )}
              >
                <item.icon
                  size={20}
                  className={cn(
                    'transition-all duration-300',
                    isActive
                      ? 'text-blue-400 scale-110'
                      : 'text-gray-500 group-hover:text-white group-hover:scale-110',
                  )}
                />
                <span className="text-sm font-black uppercase tracking-widest">{item.name}</span>

                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-blue-500 rounded-l shadow-[0_0_15px_#3b82f6]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Links */}
        <div className="p-4 mt-auto border-t border-white/5 space-y-2">
          <FooterLink icon={<ExternalLink size={14} />} label="0G Mainnet" href="https://0g.ai" />
          <FooterLink icon={<Settings size={14} />} label="Coordinator Config" href="#" />
          <div className="mt-4 p-4 rounded-xl bg-blue-600/5 border border-blue-500/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Galileo Testnet
              </span>
            </div>
            <p className="text-[9px] text-gray-600 font-mono truncate">
              Connected RPC: evmrpc-testnet.0g.ai
            </p>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function FooterLink({ icon, label, href }: { icon: any; label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-gray-500 hover:text-gray-300 uppercase tracking-tighter transition-colors"
    >
      {icon} {label}
    </a>
  );
}
