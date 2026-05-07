import React from 'react';
import { cn } from '@/lib/utils';

interface LabelStatProps {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
  className?: string;
}

export function LabelStat({ label, value, accent = false, className }: LabelStatProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted">
        {label}
      </span>
      <span
        className={cn(
          'text-lg font-display font-bold tabular-nums',
          accent ? 'text-primary' : 'text-on-surface',
        )}
      >
        {value}
      </span>
    </div>
  );
}
