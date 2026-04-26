import React from 'react';
import { cn } from '@/lib/utils';
import { AccentBar } from './AccentBar';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div className="flex items-start gap-3">
        <AccentBar orientation="vertical" className="mt-1 h-5" />
        <div>
          <h2 className="text-sm font-display font-bold uppercase tracking-widest text-on-surface">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs font-mono text-on-surface-muted mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
