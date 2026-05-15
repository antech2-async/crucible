import { AlertTriangle, CheckCircle2, Loader2, RadioTower } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContractActionStep } from '@/features/transactions/useContractAction';
import { getContractActionLabel } from '@/features/transactions/useContractAction';

type ActionStatusProps = {
  step: ContractActionStep;
  hash?: string;
  error?: string | null;
  className?: string;
};

const stepCopy: Record<ContractActionStep, { title: string; message: string }> = {
  idle: {
    title: 'Ready',
    message: 'Action is ready.',
  },
  preparing: {
    title: 'Preparing Transaction',
    message: 'Building payload and syncing off-chain metadata.',
  },
  'wallet-confirm': {
    title: 'Wallet Confirmation',
    message: 'Approve the transaction in your wallet to continue.',
  },
  'pending-chain': {
    title: 'Chain Confirmation',
    message: 'Transaction submitted. Waiting for 0G Galileo confirmation.',
  },
  success: {
    title: 'Confirmed',
    message: 'On-chain state accepted the operation.',
  },
  failed: {
    title: 'Action Failed',
    message: 'The operation did not complete.',
  },
};

export function ActionStatus({ step, hash, error, className }: ActionStatusProps) {
  if (step === 'idle' && !error) return null;

  const isBusy = step === 'preparing' || step === 'wallet-confirm' || step === 'pending-chain';
  const isSuccess = step === 'success';
  const isFailed = step === 'failed' || Boolean(error);
  const copy = stepCopy[isFailed ? 'failed' : step];
  const Icon = isFailed ? AlertTriangle : isSuccess ? CheckCircle2 : isBusy ? Loader2 : RadioTower;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded border border-border-strong/15 bg-surface/65 p-3',
        isBusy && 'border-primary/25 bg-primary/5',
        isSuccess && 'border-secondary/25 bg-secondary/5',
        isFailed && 'border-danger/25 bg-danger/10',
        className,
      )}
      aria-live="polite"
    >
      {isBusy ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent readout-pulse" />
      ) : null}
      <div className="flex items-start gap-3">
        <Icon
          size={15}
          className={cn(
            'mt-0.5 shrink-0 text-on-surface-muted',
            isBusy && 'animate-spin text-primary',
            isSuccess && 'text-secondary',
            isFailed && 'text-danger',
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface">
              {copy.title}
            </p>
            <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
              {getContractActionLabel(step)}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-on-surface-muted">
            {error || copy.message}
          </p>
          {hash ? (
            <p className="mt-2 truncate font-mono text-[9px] uppercase tracking-widest text-primary">
              Tx {hash.slice(0, 10)}...{hash.slice(-8)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
