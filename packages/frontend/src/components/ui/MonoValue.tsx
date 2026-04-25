import React from 'react';
import { cn } from '@/lib/utils';

interface MonoValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  dim?: boolean;
}

const sizeClass = {
  xs:   'text-[10px]',
  sm:   'text-xs',
  base: 'text-sm',
  lg:   'text-base',
  xl:   'text-xl',
  '2xl':'text-2xl',
};

export function MonoValue({ size = 'base', dim = false, className, children, ...props }: MonoValueProps) {
  return (
    <span
      className={cn(
        'font-mono tabular-nums',
        sizeClass[size],
        dim ? 'text-on-surface-muted' : 'text-on-surface',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
