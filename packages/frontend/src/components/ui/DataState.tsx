import { AlertTriangle, Database, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type DataStateProps = {
  title: string;
  message?: string;
  tone?: 'loading' | 'empty' | 'error';
  className?: string;
};

export function DataState({ title, message, tone = 'empty', className }: DataStateProps) {
  const Icon = tone === 'loading' ? Loader2 : tone === 'error' ? AlertTriangle : Database;

  return (
    <div
      className={cn(
        'rounded-lg border border-dashed border-border-strong/25 bg-surface-low px-6 py-16 text-center',
        tone === 'error' && 'border-danger/25 bg-danger/5',
        className,
      )}
    >
      <Icon
        className={cn(
          'mx-auto mb-4 text-on-surface-dim',
          tone === 'loading' && 'animate-spin text-primary',
          tone === 'error' && 'text-danger',
        )}
        size={28}
      />
      <h2 className="font-display text-xl font-black text-on-surface">{title}</h2>
      {message ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-on-surface-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}
