'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Coins,
  GitBranch,
  PlusCircle,
  RadioTower,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { keccak256, parseEther, toHex } from 'viem';
import { CONTRACT_ADDRESSES, TASK_ESCROW_ABI } from '@crucible/shared';
import { ActionStatus, Button } from '@/components/ui';
import { apiJson, getErrorMessage } from '@/lib/api';
import {
  getContractActionLabel,
  useContractAction,
} from '@/features/transactions/useContractAction';

type PostTaskFormProps = {
  onPosted?: () => void;
};

export default function PostTaskForm({ onPosted }: PostTaskFormProps) {
  const [dismissedHash, setDismissedHash] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const tx = useContractAction({
    onConfirmed: () => onPosted?.(),
  });

  const [formData, setFormData] = useState({
    topic: '',
    budget: '0.05',
    deadlineHours: '24',
    minWords: '500',
    minSources: '5',
    isSequential: false,
  });

  const criteriaPayload = useMemo(
    () => ({
      topic: formData.topic.trim(),
      requiredCapabilities: ['research', 'writing'],
      criteria: [
        {
          fieldName: 'wordCount',
          operator: 'gte',
          expectedValue: formData.minWords.toString(),
          weight: 2,
        },
        {
          fieldName: 'sourceCount',
          operator: 'gte',
          expectedValue: formData.minSources.toString(),
          weight: 1,
        },
      ],
      isSequential: formData.isSequential,
      version: 1,
    }),
    [formData.isSequential, formData.minSources, formData.minWords, formData.topic],
  );

  const criteriaHash = useMemo(
    () => keccak256(toHex(JSON.stringify(criteriaPayload))),
    [criteriaPayload],
  );

  const criteriaURI = useMemo(() => `0g://criteria/${criteriaHash.slice(2, 18)}`, [criteriaHash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setStorageWarning(null);

    const budget = normalizeDecimalInput(formData.budget);
    const deadlineHours = Math.max(1, parseInt(formData.deadlineHours, 10));

    if (!formData.topic.trim()) {
      setFormError('Add a task topic before posting.');
      return;
    }

    if (!Number.isFinite(Number(budget)) || Number(budget) <= 0) {
      setFormError('Enter a valid task budget.');
      return;
    }

    const uploadCriteria = async () => {
      try {
        await apiJson('/api/upload-criteria', {
          method: 'POST',
          body: JSON.stringify(criteriaPayload),
        });
      } catch (err) {
        setStorageWarning(
          `${getErrorMessage(err, 'Criteria storage failed')}. The on-chain task will still keep the criteria hash.`,
        );
      }
    };

    const deadlineSeconds = Math.floor(Date.now() / 1000) + deadlineHours * 3600;

    try {
      await tx.execute(
        {
          address: CONTRACT_ADDRESSES.TASK_ESCROW as `0x${string}`,
          abi: TASK_ESCROW_ABI,
          functionName: 'postTask',
          args: [
            BigInt(deadlineSeconds),
            criteriaHash as `0x${string}`,
            criteriaURI,
            formData.isSequential,
          ],
          value: parseEther(budget),
        },
        uploadCriteria,
      );
    } catch (err) {
      setFormError(getErrorMessage(err, 'Transaction failed'));
    }
  };

  const showConfirmation = Boolean(tx.step === 'success' && tx.hash && dismissedHash !== tx.hash);

  if (showConfirmation) {
    return (
      <section className="panel-interactive rounded-lg border border-secondary/30 bg-surface-low p-7 text-center shadow-[0_18px_44px_-30px_rgba(113,215,205,0.26)]">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded border border-secondary/40 bg-secondary/10">
          <CheckCircle2 className="text-secondary" size={24} />
        </div>
        <h3 className="font-display text-xl font-black uppercase tracking-tight text-on-surface">
          Task Posted
        </h3>
        <p className="mt-2 break-all font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
          Tx {tx.hash?.slice(0, 10)}...{tx.hash?.slice(-8)}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-6"
          onClick={() => {
            setDismissedHash(tx.hash ?? null);
            tx.reset();
          }}
        >
          Create Another
        </Button>
      </section>
    );
  }

  return (
    <section className="panel-interactive rounded-lg border border-border-strong/15 bg-surface-low shadow-[0_18px_44px_-32px_rgba(255,213,151,0.22)]">
      <div className="flex items-start justify-between gap-4 border-b border-border-strong/10 p-5">
        <div>
          <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
            <PlusCircle size={14} />
            New Task Escrow
          </div>
          <h2 className="font-display text-2xl font-black tracking-tight text-on-surface">
            Post New Task
          </h2>
          <p className="mt-1 text-xs text-on-surface-dim">
            Task criteria are saved to 0G Storage before the TaskEscrow transaction.
          </p>
        </div>
        <ShieldCheck size={20} className="mt-1 text-primary/45" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-5">
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
            Task Topic
          </label>
          <input
            required
            type="text"
            placeholder="0G storage benchmark summary"
            className="w-full rounded border border-border bg-surface px-3 py-2.5 font-mono text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-dim focus:border-primary"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
              Task Budget
            </label>
            <div className="relative">
              <input
                required
                type="number"
                min="0.0001"
                step="0.0001"
                className="w-full rounded border border-border bg-surface py-2.5 pl-3 pr-10 font-mono text-sm text-on-surface outline-none transition-colors focus:border-primary"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
              <Coins
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-dim"
                size={13}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
              Deadline (hours)
            </label>
            <div className="relative">
              <input
                required
                type="number"
                min="1"
                className="w-full rounded border border-border bg-surface py-2.5 pl-3 pr-10 font-mono text-sm text-on-surface outline-none transition-colors focus:border-primary"
                value={formData.deadlineHours}
                onChange={(e) => setFormData({ ...formData, deadlineHours: e.target.value })}
              />
              <span className="absolute right-9 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
                hrs
              </span>
              <Clock
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-dim"
                size={13}
              />
            </div>
            <p className="mt-1.5 font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
              Closes {formData.deadlineHours || '0'} hours after posting
            </p>
          </div>
        </div>

        <div>
          <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
            Agent Run Mode
          </label>
          <div className="grid grid-cols-2 overflow-hidden rounded border border-border bg-surface p-px">
            <ModeButton
              active={!formData.isSequential}
              icon={<RadioTower size={13} />}
              label="Parallel"
              name="executionMode"
              value="parallel"
              onClick={() => setFormData({ ...formData, isSequential: false })}
            />
            <ModeButton
              active={formData.isSequential}
              icon={<GitBranch size={13} />}
              label="Sequential"
              name="executionMode"
              value="sequential"
              onClick={() => setFormData({ ...formData, isSequential: true })}
            />
          </div>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
            {formData.isSequential
              ? 'Sequential: agents run in order'
              : 'Parallel: agents work together'}
          </p>
        </div>

        <div className="space-y-4 border-y border-border-strong/10 py-4">
          <SliderField
            label="Minimum Length"
            value={formData.minWords}
            suffix="Words"
            min="100"
            max="2000"
            step="100"
            onChange={(value) => setFormData({ ...formData, minWords: value })}
          />
          <SliderField
            label="Required Sources"
            value={formData.minSources}
            suffix="Links"
            min="1"
            max="20"
            step="1"
            onChange={(value) => setFormData({ ...formData, minSources: value })}
          />
        </div>

        <div className="min-w-0 rounded border border-border bg-surface px-3 py-2.5">
          <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
            Task Criteria Hash
          </p>
          <p className="truncate font-mono text-[10px] text-primary">{criteriaHash}</p>
        </div>

        {storageWarning ? (
          <div className="rounded border border-primary/20 bg-primary/5 p-3 font-mono text-[9px] uppercase tracking-widest text-primary-muted">
            {storageWarning}
          </div>
        ) : null}

        {formError || tx.error ? (
          <div className="rounded border border-danger/25 bg-danger/10 p-3 font-mono text-[9px] uppercase tracking-widest text-danger">
            {formError || tx.error}
          </div>
        ) : null}

        <ActionStatus step={tx.step} hash={tx.hash} error={tx.error} />

        <Button
          variant="primary"
          className="w-full justify-center py-3"
          type="submit"
          disabled={tx.isBusy}
          isLoading={tx.isBusy}
          loadingText={getContractActionLabel(tx.step)}
        >
          Post Task <Send size={14} />
        </Button>
      </form>
    </section>
  );
}

function normalizeDecimalInput(value: string) {
  return value.trim().replace(',', '.');
}

function ModeButton({
  active,
  icon,
  label,
  name,
  value,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  name: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <label className="relative flex cursor-pointer items-center justify-center overflow-hidden rounded px-3 py-2.5 font-mono text-[10px] uppercase tracking-widest text-on-surface-muted transition-colors hover:bg-surface-low hover:text-on-surface">
      <input
        type="radio"
        name={name}
        value={value}
        checked={active}
        onChange={onClick}
        className="peer sr-only"
      />
      <span className="absolute inset-0 rounded bg-primary/10 opacity-0 transition-opacity peer-checked:opacity-100" />
      <span className="relative flex items-center gap-2 transition-colors peer-checked:text-primary">
        {icon}
        {label}
      </span>
    </label>
  );
}

function SliderField({
  label,
  value,
  suffix,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: string;
  suffix: string;
  min: string;
  max: string;
  step: string;
  onChange: (value: string) => void;
}) {
  const numericValue = Number(value);
  const numericMin = Number(min);
  const numericMax = Number(max);
  const progress =
    Number.isFinite(numericValue) && Number.isFinite(numericMin) && Number.isFinite(numericMax)
      ? ((numericValue - numericMin) / (numericMax - numericMin)) * 100
      : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
          {label}
        </span>
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
          {value} {suffix}
        </span>
      </div>
      <div className="relative pb-5 pt-4">
        <div
          className="absolute top-0 -translate-x-1/2 rounded border border-primary/30 bg-surface px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-primary shadow-[0_10px_24px_-18px_rgba(255,176,0,0.9)]"
          style={{ left: `${Math.min(100, Math.max(0, progress))}%` }}
        >
          {value} {suffix}
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          aria-label={`${label}: ${value} ${suffix}`}
          className="h-1 w-full cursor-pointer appearance-none rounded bg-border accent-[#ffb000]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onInput={(e) => onChange(e.currentTarget.value)}
        />
        <div className="mt-2 flex justify-between font-mono text-[8px] uppercase tracking-widest text-on-surface-dim">
          <span>
            {min} {suffix}
          </span>
          <span>
            {max} {suffix}
          </span>
        </div>
      </div>
    </div>
  );
}
