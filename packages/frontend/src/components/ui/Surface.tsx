import React from 'react';
import { cn } from '@/lib/utils';

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 'base' | 'low' | 'container' | 'high';
  bordered?: boolean;
  children: React.ReactNode;
}

const levelClass = {
  base: 'bg-surface',
  low: 'bg-surface-low',
  container: 'bg-surface-container',
  high: 'bg-surface-high',
};

export function Surface({ level = 'container', bordered = true, className, children, ...props }: SurfaceProps) {
  return (
    <div
      className={cn(levelClass[level], bordered && 'border border-border', className)}
      {...props}
    >
      {children}
    </div>
  );
}
