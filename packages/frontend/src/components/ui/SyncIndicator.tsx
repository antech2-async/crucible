import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type SyncIndicatorProps = {
  active?: boolean;
  label?: string;
  className?: string;
};

export function SyncIndicator({
  active = false,
  label = 'Syncing',
  className,
}: SyncIndicatorProps) {
  if (!active) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border border-secondary/25 bg-secondary/10 px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-widest text-secondary',
        className,
      )}
      aria-live="polite"
    >
      <Loader2 size={10} className="animate-spin" />
      {label}
    </span>
  );
}
