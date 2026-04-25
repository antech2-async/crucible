import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variantClass = {
  primary: 'bg-primary text-on-primary hover:bg-primary-muted border border-primary font-display font-bold',
  outline: 'bg-transparent text-primary border border-primary hover:bg-primary/10 font-display font-bold',
  ghost: 'bg-transparent text-on-surface-muted border border-transparent hover:border-border hover:text-on-surface font-display',
  danger: 'bg-transparent text-danger border border-danger hover:bg-danger/10 font-display font-bold',
};

const sizeClass = {
  sm: 'px-3 py-1.5 text-xs tracking-widest uppercase',
  md: 'px-5 py-2.5 text-xs tracking-widest uppercase',
  lg: 'px-7 py-3.5 text-sm tracking-widest uppercase',
};

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
