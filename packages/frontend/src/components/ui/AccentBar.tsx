import React from 'react';
import { cn } from '@/lib/utils';

interface AccentBarProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function AccentBar({ orientation = 'horizontal', className }: AccentBarProps) {
  return (
    <div
      className={cn(
        'bg-primary flex-shrink-0',
        orientation === 'horizontal' ? 'w-full h-px' : 'h-full w-px',
        className,
      )}
    />
  );
}
