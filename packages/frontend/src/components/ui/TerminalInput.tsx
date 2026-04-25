import React from 'react';
import { cn } from '@/lib/utils';

interface TerminalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function TerminalInput({ label, error, className, id, ...props }: TerminalInputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted"
        >
          {label}
        </label>
      )}
      <div className="flex items-center border border-border bg-surface-low focus-within:border-primary transition-colors">
        <span className="px-3 text-primary font-mono text-xs select-none">{'>'}</span>
        <input
          id={id}
          className={cn(
            'flex-1 bg-transparent py-2.5 pr-3 text-sm font-mono text-on-surface placeholder:text-on-surface-dim outline-none',
            className,
          )}
          {...props}
        />
      </div>
      {error && (
        <span className="text-[10px] font-mono text-danger uppercase tracking-widest">{error}</span>
      )}
    </div>
  );
}
