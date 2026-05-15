import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
}

const variantClass = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-muted border border-primary font-display font-bold',
  outline:
    'bg-transparent text-primary border border-primary hover:bg-primary/10 font-display font-bold',
  ghost:
    'bg-transparent text-on-surface-muted border border-transparent hover:border-border hover:text-on-surface font-display',
  danger:
    'bg-transparent text-danger border border-danger hover:bg-danger/10 font-display font-bold',
};

const sizeClass = {
  sm: 'px-3 py-1.5 text-xs tracking-widest uppercase',
  md: 'px-5 py-2.5 text-xs tracking-widest uppercase',
  lg: 'px-7 py-3.5 text-sm tracking-widest uppercase',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  isLoading = false,
  loadingText,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 overflow-hidden transition-[background-color,border-color,color,opacity,transform,box-shadow] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40',
        variantClass[variant],
        sizeClass[size],
        isLoading && 'cursor-wait',
        className,
      )}
      aria-busy={isLoading || undefined}
      data-loading={isLoading || undefined}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
