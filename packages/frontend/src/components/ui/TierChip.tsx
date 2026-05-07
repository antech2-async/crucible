import React from 'react';
import { cn } from '@/lib/utils';

interface TierChipProps {
  tier: number;
  className?: string;
}

const TIER_MAP: Record<number, { label: string; colorClass: string; borderClass: string }> = {
  4: { label: 'Elite', colorClass: 'text-tier-elite', borderClass: 'border-tier-elite/50' },
  3: { label: 'High', colorClass: 'text-tier-high', borderClass: 'border-tier-high/50' },
  2: { label: 'Mid', colorClass: 'text-tier-mid', borderClass: 'border-tier-mid/50' },
  1: { label: 'Low', colorClass: 'text-tier-low', borderClass: 'border-tier-low/50' },
  0: { label: 'Unranked', colorClass: 'text-on-surface-dim', borderClass: 'border-border' },
};

export function TierChip({ tier, className }: TierChipProps) {
  const config = TIER_MAP[tier] ?? TIER_MAP[0];
  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest border',
        config.colorClass,
        config.borderClass,
        className,
      )}
    >
      T{tier} {config.label}
    </span>
  );
}
