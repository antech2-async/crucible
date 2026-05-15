'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  BadgeCheck,
  Coins,
  Cpu,
  Database,
  FileJson,
  LockKeyhole,
  RadioTower,
  ShieldCheck,
  Upload,
  Wallet,
} from 'lucide-react';
import { formatEther, parseEther } from 'viem';
import { useAccount, useReadContract } from 'wagmi';
import { AGENT_REGISTRY_ABI, AGENT_STAKE_VAULT_ABI, CONTRACT_ADDRESSES } from '@crucible/shared';
import { cn } from '@/lib/utils';
import { ActionStatus, Button } from '@/components/ui';
import {
  getContractActionLabel,
  useContractAction,
} from '@/features/transactions/useContractAction';
import { getErrorMessage } from '@/lib/api';

type TeeProvider = '0g-tee' | 'external';
type LedgerEvent = { label: string; value: string; tone: 'primary' | 'secondary' | 'danger' };

const CAPABILITIES = ['research', 'writing', 'coding', 'verification', 'data-sync'];

export default function StakePage() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [nodeLabel, setNodeLabel] = useState('');
  const [stakeAmount, setStakeAmount] = useState('0.05');
  const [withdrawAmount, setWithdrawAmount] = useState('0.01');
  const [capabilities, setCapabilities] = useState<string[]>(['verification']);
  const [teeProvider, setTeeProvider] = useState<TeeProvider>('0g-tee');
  const [computeIntensity, setComputeIntensity] = useState(7);
  const [localEvents, setLocalEvents] = useState<LedgerEvent[]>([]);

  const vaultAddress = CONTRACT_ADDRESSES.AGENT_STAKE_VAULT as `0x${string}`;
  const registryAddress = CONTRACT_ADDRESSES.AGENT_REGISTRY as `0x${string}`;
  const walletAddress = mounted ? address : undefined;
  const walletConnected = mounted && isConnected;
  const depositTx = useContractAction({
    onConfirmed(hash) {
      setLocalEvents((prev) =>
        [
          { label: 'Deposit confirmed', value: shortHash(hash), tone: 'secondary' as const },
          ...prev,
        ].slice(0, 4),
      );
      void refetchDeposit();
    },
  });
  const withdrawTx = useContractAction({
    onConfirmed(hash) {
      setLocalEvents((prev) =>
        [
          { label: 'Withdraw confirmed', value: shortHash(hash), tone: 'primary' as const },
          ...prev,
        ].slice(0, 4),
      );
      void refetchDeposit();
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: freeDeposit, refetch: refetchDeposit } = useReadContract({
    address: vaultAddress,
    abi: AGENT_STAKE_VAULT_ABI,
    functionName: 'deposits',
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: Boolean(walletAddress) },
  });

  const { data: slashedTreasury } = useReadContract({
    address: vaultAddress,
    abi: AGENT_STAKE_VAULT_ABI,
    functionName: 'slashedTreasury',
  });

  const { data: subsidyPercent } = useReadContract({
    address: vaultAddress,
    abi: AGENT_STAKE_VAULT_ABI,
    functionName: 'subsidyPercent',
  });

  const { data: totalAgents } = useReadContract({
    address: registryAddress,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'getTotalAgents',
  });

  const { data: nativeMinStake } = useReadContract({
    address: registryAddress,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'tierStakeRequirements',
    args: [0],
  });

  const identityHash = useMemo(() => {
    const input = `${walletAddress ?? '0x0'}:${nodeLabel}:${capabilities.join(',')}:${teeProvider}`;
    let hash = 0;
    for (let index = 0; index < input.length; index += 1) {
      hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
    }
    return `0x${hash.toString(16).padStart(8, '0')}...local`;
  }, [capabilities, nodeLabel, teeProvider, walletAddress]);

  const toggleCapability = (capability: string) => {
    setCapabilities((prev) =>
      prev.includes(capability)
        ? prev.filter((item) => item !== capability)
        : [...prev, capability],
    );
  };

  const submitDeposit = async () => {
    const amount = normalizeDecimalInput(stakeAmount);
    if (!amount || Number(amount) <= 0 || depositTx.isBusy || withdrawTx.isBusy) return;

    try {
      const hash = await depositTx.execute({
        address: vaultAddress,
        abi: AGENT_STAKE_VAULT_ABI,
        functionName: 'deposit',
        value: parseEther(amount),
      });
      setLocalEvents((prev) =>
        [
          { label: 'Deposit submitted', value: shortHash(hash), tone: 'secondary' as const },
          ...prev,
        ].slice(0, 4),
      );
    } catch (error) {
      setLocalEvents((prev) =>
        [
          { label: 'Deposit failed', value: getErrorMessage(error), tone: 'danger' as const },
          ...prev,
        ].slice(0, 4),
      );
    }
  };

  const submitWithdraw = async () => {
    const amount = normalizeDecimalInput(withdrawAmount);
    if (!amount || Number(amount) <= 0 || depositTx.isBusy || withdrawTx.isBusy) return;

    try {
      const hash = await withdrawTx.execute({
        address: vaultAddress,
        abi: AGENT_STAKE_VAULT_ABI,
        functionName: 'withdraw',
        args: [parseEther(amount)],
      });
      setLocalEvents((prev) =>
        [
          { label: 'Withdraw submitted', value: shortHash(hash), tone: 'primary' as const },
          ...prev,
        ].slice(0, 4),
      );
    } catch (error) {
      setLocalEvents((prev) =>
        [
          { label: 'Withdraw failed', value: getErrorMessage(error), tone: 'danger' as const },
          ...prev,
        ].slice(0, 4),
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1260px] pb-10">
      <header className="mb-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            <LockKeyhole size={13} />
            Stake // Agent Identity
          </div>
          <h1 className="font-display text-4xl font-black uppercase tracking-tight text-on-surface md:text-5xl">
            Agent Stake Vault
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-muted">
            Deposit agent stake, prepare identity metadata, and inspect vault status from deployed
            Crucible contracts.
          </p>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-border-strong/15 bg-surface-low shadow-[0_18px_44px_-34px_rgba(255,176,0,0.45)] sm:min-w-[460px]">
          <HudMetric label="Available Stake" value={formatToken(freeDeposit)} icon={Wallet} />
          <HudMetric
            label="Min Native Stake"
            value={formatToken(nativeMinStake)}
            icon={ShieldCheck}
          />
          <HudMetric label="Agents" value={formatCount(totalAgents)} icon={RadioTower} />
        </div>
      </header>

      <div className="grid grid-cols-12 items-stretch gap-5">
        <section className="panel-interactive col-span-12 overflow-hidden rounded-lg border border-primary/25 bg-surface-low shadow-[0_22px_54px_-38px_rgba(255,213,151,0.34)] xl:col-span-8">
          <div className="relative h-full border-l-2 border-primary-muted/80 p-5 md:p-6">
            <div className="absolute bottom-0 right-0 h-24 w-24 bg-[linear-gradient(135deg,transparent_42%,rgba(255,213,151,0.07)_42%,rgba(255,213,151,0.07)_54%,transparent_54%)]" />
            <div className="relative">
              <div className="mb-7 max-w-3xl">
                <h2 className="font-display text-3xl font-black text-on-surface">
                  Agent Stake Setup
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-muted">
                  Vault balance is the unlocked stake owned by the connected wallet. Task
                  assignments lock part of this stake later through TaskEscrow.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Readout
                  label="Available Stake"
                  value={formatToken(freeDeposit)}
                  accent="secondary"
                />
                <Readout label="Slashing Treasury" value={formatToken(slashedTreasury)} />
                <Readout
                  label="First Task Subsidy"
                  value={subsidyPercent == null ? '-' : `${subsidyPercent.toString()}%`}
                />
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
                <IdentityPanel
                  nodeLabel={nodeLabel}
                  setNodeLabel={setNodeLabel}
                  capabilities={capabilities}
                  toggleCapability={toggleCapability}
                  identityHash={identityHash}
                />
                <NodeConfigPanel
                  teeProvider={teeProvider}
                  setTeeProvider={setTeeProvider}
                  computeIntensity={computeIntensity}
                  setComputeIntensity={setComputeIntensity}
                  stakeAmount={stakeAmount}
                  setStakeAmount={setStakeAmount}
                  withdrawAmount={withdrawAmount}
                  setWithdrawAmount={setWithdrawAmount}
                  isConnected={walletConnected}
                  depositStep={depositTx.step}
                  withdrawStep={withdrawTx.step}
                  depositHash={depositTx.hash}
                  withdrawHash={withdrawTx.hash}
                  depositError={depositTx.error}
                  withdrawError={withdrawTx.error}
                  isPending={depositTx.isBusy || withdrawTx.isBusy}
                  onDeposit={submitDeposit}
                  onWithdraw={submitWithdraw}
                />
              </div>
            </div>
          </div>
        </section>

        <aside className="col-span-12 flex flex-col gap-5 xl:col-span-4">
          <OperatorIdentityCard
            address={walletAddress}
            isConnected={walletConnected}
            freeDeposit={freeDeposit}
            nativeMinStake={nativeMinStake}
            capabilities={capabilities}
          />
          <LedgerPanel
            events={localEvents}
            vaultAddress={vaultAddress}
            treasury={slashedTreasury}
            subsidyPercent={subsidyPercent}
          />
        </aside>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-4">
        <FooterReadout label="Vault Contract" value={shortAddress(vaultAddress)} />
        <FooterReadout label="Registry Contract" value={shortAddress(registryAddress)} />
        <FooterReadout label="Registered Agents" value={formatCount(totalAgents)} accent />
        <FooterReadout label="Native Min Stake" value={formatToken(nativeMinStake)} />
      </div>
    </div>
  );
}

function HudMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="border-r border-border-strong/10 p-4 last:border-r-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
          {label}
        </span>
        <Icon size={14} className="text-primary/80" />
      </div>
      <p className="font-display text-xl font-black text-on-surface">{value}</p>
    </div>
  );
}

function Readout({ label, value, accent }: { label: string; value: string; accent?: 'secondary' }) {
  return (
    <div className="rounded border border-border-strong/10 bg-surface-container/55 p-4">
      <p className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">{label}</p>
      <p
        className={cn(
          'mt-2 font-display text-2xl font-black',
          accent === 'secondary' ? 'text-secondary' : 'text-on-surface',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function IdentityPanel({
  nodeLabel,
  setNodeLabel,
  capabilities,
  toggleCapability,
  identityHash,
}: {
  nodeLabel: string;
  setNodeLabel: (value: string) => void;
  capabilities: string[];
  toggleCapability: (capability: string) => void;
  identityHash: string;
}) {
  return (
    <section className="rounded-lg border border-border-strong/15 bg-surface-container/70 p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface">
          <FileJson size={15} className="text-primary" />
          Agent Identity
        </div>
        <span className="rounded border border-secondary/25 bg-secondary/10 px-2 py-1 font-mono text-[8px] uppercase tracking-widest text-secondary">
          Local Config
        </span>
      </div>

      <label className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
        Agent Label
      </label>
      <input
        value={nodeLabel}
        onChange={(event) => setNodeLabel(event.target.value)}
        placeholder="e.g. LYRA-004"
        className="mb-4 w-full rounded border border-border bg-surface px-3 py-3 font-mono text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-dim focus:border-primary/60"
      />

      <div className="mb-4">
        <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
          Capabilities
        </p>
        <div className="flex flex-wrap gap-2">
          {CAPABILITIES.map((capability) => (
            <button
              key={capability}
              type="button"
              onClick={() => toggleCapability(capability)}
              className={cn(
                'min-h-9 rounded border px-3 font-mono text-[9px] uppercase tracking-widest transition-colors',
                capabilities.includes(capability)
                  ? 'border-primary/45 bg-primary/10 text-primary'
                  : 'border-border text-on-surface-muted hover:border-border-strong hover:text-on-surface',
              )}
            >
              {capability}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded border border-dashed border-border-strong/20 bg-surface/45 p-5 text-center">
        <Upload className="mx-auto mb-3 text-primary-muted" size={24} />
        <p className="font-display text-sm font-bold text-on-surface">Agent Identity Draft</p>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-on-surface-muted">
          This prepares local metadata for an agent identity. INFT minting and registry commit still
          happen in the dedicated registration flow.
        </p>
        <p className="mt-4 break-all font-mono text-[10px] uppercase tracking-widest text-primary">
          {identityHash}
        </p>
      </div>
    </section>
  );
}

function NodeConfigPanel({
  teeProvider,
  setTeeProvider,
  computeIntensity,
  setComputeIntensity,
  stakeAmount,
  setStakeAmount,
  withdrawAmount,
  setWithdrawAmount,
  isConnected,
  depositStep,
  withdrawStep,
  depositHash,
  withdrawHash,
  depositError,
  withdrawError,
  isPending,
  onDeposit,
  onWithdraw,
}: {
  teeProvider: TeeProvider;
  setTeeProvider: (provider: TeeProvider) => void;
  computeIntensity: number;
  setComputeIntensity: (value: number) => void;
  stakeAmount: string;
  setStakeAmount: (value: string) => void;
  withdrawAmount: string;
  setWithdrawAmount: (value: string) => void;
  isConnected: boolean;
  depositStep: ReturnType<typeof useContractAction>['step'];
  withdrawStep: ReturnType<typeof useContractAction>['step'];
  depositHash?: `0x${string}`;
  withdrawHash?: `0x${string}`;
  depositError?: string | null;
  withdrawError?: string | null;
  isPending: boolean;
  onDeposit: () => void;
  onWithdraw: () => void;
}) {
  const activeStep = depositStep !== 'idle' ? depositStep : withdrawStep;
  const activeHash = depositStep !== 'idle' ? depositHash : withdrawHash;
  const activeError = depositStep !== 'idle' ? depositError : withdrawError;

  return (
    <section className="rounded-lg border border-border-strong/15 bg-surface-container/70 p-5">
      <div className="mb-5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface">
        <Cpu size={15} className="text-primary-muted" />
        Agent Configuration
      </div>

      <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
        Verification Path
      </p>
      <div className="mb-5 grid grid-cols-2 gap-2">
        <ConfigButton
          active={teeProvider === '0g-tee'}
          label="0G TEE"
          onClick={() => setTeeProvider('0g-tee')}
        />
        <ConfigButton
          active={teeProvider === 'external'}
          label="External"
          onClick={() => setTeeProvider('external')}
        />
      </div>

      <div className="mb-5">
        <div className="mb-2 flex justify-between gap-3">
          <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
            Compute Load
          </span>
          <span className="font-mono text-[10px] font-bold text-primary">
            {computeIntensity}/10
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={computeIntensity}
          onChange={(event) => setComputeIntensity(Number(event.target.value))}
          className="w-full accent-primary"
        />
      </div>

      <div className="grid gap-3">
        <AmountInput
          label="Deposit Agent Stake"
          value={stakeAmount}
          onChange={setStakeAmount}
          icon={ArrowDownToLine}
        />
        <Button
          type="button"
          onClick={onDeposit}
          disabled={!isConnected || isPending}
          isLoading={
            depositStep === 'preparing' ||
            depositStep === 'wallet-confirm' ||
            depositStep === 'pending-chain'
          }
          loadingText={getContractActionLabel(depositStep)}
          className="min-h-11 rounded px-4 text-sm normal-case tracking-normal"
        >
          Deposit Stake
          <Coins size={14} />
        </Button>

        <AmountInput
          label="Withdraw Available Stake"
          value={withdrawAmount}
          onChange={setWithdrawAmount}
          icon={Wallet}
        />
        <Button
          variant="outline"
          type="button"
          onClick={onWithdraw}
          disabled={!isConnected || isPending}
          isLoading={
            withdrawStep === 'preparing' ||
            withdrawStep === 'wallet-confirm' ||
            withdrawStep === 'pending-chain'
          }
          loadingText={getContractActionLabel(withdrawStep)}
          className="min-h-11 rounded px-4 text-sm normal-case tracking-normal"
        >
          Withdraw Available
          <Wallet size={14} />
        </Button>
        {!isConnected ? (
          <p className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
            Connect wallet to run vault transactions.
          </p>
        ) : null}
        <ActionStatus step={activeStep} hash={activeHash} error={activeError} className="mt-1" />
      </div>
    </section>
  );
}

function ConfigButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-11 rounded border px-3 font-mono text-[10px] uppercase tracking-widest transition-colors',
        active
          ? 'border-primary/60 bg-primary/10 text-primary'
          : 'border-border bg-surface text-on-surface-muted hover:text-on-surface',
      )}
    >
      {label}
    </button>
  );
}

function AmountInput({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ElementType;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
        {label}
      </span>
      <span className="relative block">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-dim" size={14} />
        <input
          type="number"
          step="0.001"
          min="0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded border border-border bg-surface py-3 pl-9 pr-12 font-mono text-sm text-on-surface outline-none transition-colors focus:border-primary/60"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-widest text-on-surface-dim">
          0G
        </span>
      </span>
    </label>
  );
}

function OperatorIdentityCard({
  address,
  isConnected,
  freeDeposit,
  nativeMinStake,
  capabilities,
}: {
  address?: `0x${string}`;
  isConnected: boolean;
  freeDeposit: unknown;
  nativeMinStake: unknown;
  capabilities: string[];
}) {
  const deposit = toNumber(freeDeposit);
  const minimum = toNumber(nativeMinStake);
  const coverage = minimum > 0 ? Math.min(100, Math.round((deposit / minimum) * 100)) : 0;
  const linked = isConnected && Boolean(address);

  return (
    <section className="panel-interactive overflow-hidden rounded-lg border border-border-strong/15 bg-surface-low">
      <div className="relative h-full min-h-[340px] p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(113,215,205,0.12),transparent_35%)]" />
        <div className="relative">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
                Wallet Link
              </p>
              <h3 className="mt-1 font-display text-2xl font-black text-on-surface">
                {linked && address ? shortAddress(address) : 'No Wallet Linked'}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-on-surface-dim">
                {linked
                  ? 'Vault data is bound to this wallet.'
                  : 'Connect wallet to show live vault data.'}
              </p>
            </div>
            <div className="rounded border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[8px] uppercase tracking-widest text-primary">
              Vault
            </div>
          </div>

          <div className="relative mb-6 h-48 overflow-hidden rounded border border-border-strong/15 bg-[linear-gradient(145deg,rgba(54,52,51,0.85),rgba(14,13,12,1))]">
            <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(113,215,205,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(113,215,205,0.08)_1px,transparent_1px)] [background-size:18px_18px]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/50 to-transparent readout-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              {linked ? <LinkedIdentityCore /> : <OperatorDockSlot />}
            </div>
            <div className="absolute bottom-3 left-3 rounded border border-border-strong/15 bg-surface/70 px-2 py-1 font-mono text-[8px] uppercase tracking-widest text-on-surface-dim">
              {linked ? 'Vault Linked' : 'Wallet Required'}
            </div>
          </div>

          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
                Stake Cover
              </span>
              <span className="font-mono text-[10px] font-bold text-secondary">{coverage}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-high">
              <div
                className="bar-live h-full rounded-full bg-secondary transition-[width] duration-500"
                style={{ width: `${Math.max(4, coverage)}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {capabilities.length ? (
              capabilities.map((capability) => (
                <span
                  key={capability}
                  className="rounded border border-border-strong/15 bg-surface/70 px-2 py-1 font-mono text-[8px] uppercase tracking-widest text-on-surface-muted"
                >
                  {capability}
                </span>
              ))
            ) : (
              <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
                No capabilities selected
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function OperatorDockSlot() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-x-6 top-1/2 h-px bg-gradient-to-r from-transparent via-secondary/35 to-transparent" />
      <div className="absolute left-1/2 top-5 h-[calc(100%-40px)] w-px bg-gradient-to-b from-transparent via-secondary/25 to-transparent" />
      <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-secondary/20 bg-secondary/5 shadow-[0_0_48px_-20px_rgba(113,215,205,0.9)]" />
      <div className="absolute left-1/2 top-1/2 h-20 w-44 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-primary/10" />

      <svg
        viewBox="0 0 420 190"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="dockCard" x1="112" y1="36" x2="300" y2="138">
            <stop stopColor="rgb(var(--surface-high))" stopOpacity="0.96" />
            <stop offset="1" stopColor="rgb(var(--surface))" stopOpacity="0.94" />
          </linearGradient>
          <linearGradient id="dockGold" x1="120" y1="60" x2="294" y2="130">
            <stop stopColor="rgb(var(--primary-muted))" stopOpacity="0.88" />
            <stop offset="1" stopColor="rgb(var(--primary))" stopOpacity="0.42" />
          </linearGradient>
          <radialGradient id="dockCore" cx="50%" cy="50%" r="50%">
            <stop stopColor="rgb(var(--secondary))" stopOpacity="0.36" />
            <stop offset="1" stopColor="rgb(var(--secondary))" stopOpacity="0" />
          </radialGradient>
        </defs>

        <path d="M62 138 104 72h212l42 66-38 18H100Z" fill="url(#dockCore)" />
        <path
          d="M82 124 126 62h168l44 62-34 18H116Z"
          fill="rgb(var(--surface-container))"
          opacity="0.72"
        />
        <path d="M106 116 137 76h146l31 40-24 12H130Z" fill="rgb(var(--surface))" opacity="0.92" />
        <path
          d="M133 55h154l17 18v63l-17 18H133l-17-18V73Z"
          fill="url(#dockCard)"
          stroke="rgb(var(--primary))"
          strokeOpacity="0.32"
          strokeWidth="2"
        />
        <path
          d="M151 72h118M151 135h118M172 91h72"
          stroke="rgb(var(--primary-muted))"
          strokeOpacity="0.36"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M83 84h34M303 84h34M72 102h45M303 102h45"
          stroke="rgb(var(--primary))"
          strokeOpacity="0.55"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M210 78 194 99h18l-13 31 31-42h-18l10-10Z" fill="url(#dockGold)" />
        <path
          d="M72 153h276M102 164h216"
          stroke="rgb(var(--secondary))"
          strokeOpacity="0.22"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute left-4 top-4 rounded border border-primary/20 bg-surface/70 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.22em] text-primary">
        Wallet Slot
      </div>
      <div className="absolute bottom-4 right-4 rounded border border-secondary/15 bg-surface/70 px-2 py-1 font-mono text-[7px] uppercase tracking-[0.22em] text-secondary">
        Connect Required
      </div>
    </div>
  );
}

function LinkedIdentityCore() {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-secondary/25 bg-secondary/10">
      <div className="absolute h-36 w-px bg-secondary/20" />
      <div className="absolute h-px w-36 bg-secondary/20" />
      <BadgeCheck className="relative text-secondary" size={38} />
    </div>
  );
}

function LedgerPanel({
  events,
  vaultAddress,
  treasury,
  subsidyPercent,
}: {
  events: LedgerEvent[];
  vaultAddress: `0x${string}`;
  treasury: unknown;
  subsidyPercent: unknown;
}) {
  return (
    <section className="panel-interactive flex-1 rounded-lg border border-border-strong/15 bg-surface-low p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface">
          <Database size={15} className="text-primary-muted" />
          Vault Events
        </div>
        <span className="font-mono text-[8px] uppercase tracking-widest text-on-surface-dim">
          Local Session
        </span>
      </div>

      <div className="space-y-4">
        <LedgerItem label="Vault Contract" value={shortAddress(vaultAddress)} tone="primary" />
        <LedgerItem label="Slashing Treasury" value={formatToken(treasury)} tone="secondary" />
        <LedgerItem
          label="First Task Subsidy"
          value={subsidyPercent == null ? '-' : `${subsidyPercent.toString()}%`}
          tone="primary"
        />
        {events.length ? (
          events.map((event) => (
            <LedgerItem
              key={`${event.label}-${event.value}`}
              label={event.label}
              value={event.value}
              tone={event.tone}
            />
          ))
        ) : (
          <div className="rounded border border-dashed border-border-strong/20 px-4 py-6 text-center font-mono text-[10px] uppercase tracking-widest text-on-surface-dim">
            Waiting for wallet transaction
          </div>
        )}
      </div>
    </section>
  );
}

function LedgerItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'primary' | 'secondary' | 'danger';
}) {
  const toneClass = {
    primary: 'bg-primary text-primary',
    secondary: 'bg-secondary text-secondary',
    danger: 'bg-danger text-danger',
  };

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
      <span className={cn('mt-1 h-2 w-2 rounded-full', toneClass[tone].split(' ')[0])} />
      <div className="min-w-0">
        <p className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">
          {label}
        </p>
        <p
          className={cn('mt-1 truncate font-mono text-xs font-bold', toneClass[tone].split(' ')[1])}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function FooterReadout({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded border border-border-strong/10 bg-surface-low p-4">
      <p className="font-mono text-[9px] uppercase tracking-widest text-on-surface-dim">{label}</p>
      <p
        className={cn(
          'mt-2 truncate font-display text-lg font-black',
          accent ? 'text-secondary' : 'text-on-surface',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function formatToken(value: unknown) {
  if (typeof value !== 'bigint') return '-';
  const amount = Number(formatEther(value));
  if (!Number.isFinite(amount)) return '-';
  if (amount === 0) return '0 0G';
  return `${amount.toLocaleString(undefined, {
    maximumFractionDigits: amount >= 1 ? 3 : 4,
  })} 0G`;
}

function toNumber(value: unknown) {
  if (typeof value !== 'bigint') return 0;
  return Number(formatEther(value));
}

function formatCount(value: unknown) {
  if (typeof value === 'bigint') return value.toLocaleString();
  if (typeof value === 'number') return value.toLocaleString();
  return '-';
}

function shortAddress(value?: string) {
  if (!value) return '-';
  if (value.length <= 14) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function shortHash(value: string) {
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function normalizeDecimalInput(value: string) {
  return value.trim().replace(',', '.');
}
