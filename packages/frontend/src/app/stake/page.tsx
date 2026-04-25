'use client';

import React, { useState } from 'react';
import { Coins, PlusCircle, ShieldCheck, Database, Rocket } from 'lucide-react';
import { Surface, Button, SectionHeader } from '@/components/ui';

export default function StakePage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    capabilities: [] as string[],
    stake: '0.05',
  });

  const toggleCap = (cap: string) => {
    setFormData((prev) => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter((c) => c !== cap)
        : [...prev.capabilities, cap],
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-on-surface mb-1">
          Agent Staking <span className="text-primary">Portal</span>
        </h1>
        <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted">
          Register New Node Identity &amp; Commit Collateral
        </p>

        {/* Progress Stepper */}
        <div className="flex items-center gap-3 mt-6">
          <StepIndicator n={1} label="Node Config" active={step >= 1} />
          <div className={`flex-1 h-px max-w-[48px] ${step >= 2 ? 'bg-primary' : 'bg-border'}`} />
          <StepIndicator n={2} label="Storage Sync" active={step >= 2} />
          <div className={`flex-1 h-px max-w-[48px] ${step >= 3 ? 'bg-primary' : 'bg-border'}`} />
          <StepIndicator n={3} label="On-Chain Commit" active={step >= 3} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Surface level="container" className="p-7">
          <SectionHeader
            title="Configure Identity"
            subtitle="Set node name, capabilities, and stake"
            className="mb-6"
          />

          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted block mb-1.5">
                Agent Name
              </label>
              <input
                type="text"
                placeholder="e.g. Swarm-Node-01"
                className="w-full bg-surface-low border border-border py-2.5 px-3 text-sm font-mono text-on-surface placeholder:text-on-surface-dim focus:outline-none focus:border-primary transition-colors"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted block mb-1.5">
                Capabilities
              </label>
              <div className="flex flex-wrap gap-2">
                {['research', 'writing', 'coding', 'verification', 'data-sync'].map((cap) => (
                  <button
                    key={cap}
                    onClick={() => toggleCap(cap)}
                    className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest border transition-colors ${
                      formData.capabilities.includes(cap)
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-transparent border-border text-on-surface-muted hover:text-on-surface hover:border-border-strong'
                    }`}
                  >
                    {cap}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted block mb-1.5">
                Commit Stake (0G Tokens)
              </label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-dim" size={14} />
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-surface-low border border-border py-2.5 pl-9 pr-24 text-sm font-mono text-on-surface focus:outline-none focus:border-primary transition-colors"
                  value={formData.stake}
                  onChange={(e) => setFormData({ ...formData, stake: e.target.value })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono uppercase tracking-widest text-on-surface-muted">
                  Min 0.05
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full py-3"
              onMouseEnter={() => setStep(2)}
              onMouseLeave={() => setStep(1)}
            >
              Initialize Pipeline <Rocket size={14} />
            </Button>
          </div>
        </Surface>

        <div className="space-y-4">
          <InfoCard
            icon={<Database className="text-primary/60" size={18} />}
            title="0G Storage Sync"
            desc="Your node's behavioral history will be initialized as a JSON object on 0G Storage with an immutable root hash."
          />
          <InfoCard
            icon={<ShieldCheck className="text-success/80" size={18} />}
            title="INFT Integration"
            desc="An Intelligent NFT (ERC-7857) will be minted as your permanent on-chain identity, carrying your encrypted capabilities."
          />
          <div className="p-5 bg-warning/5 border border-warning/20 flex gap-4">
            <div className="w-5 h-5 border border-warning/40 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-warning font-mono text-[10px] leading-none font-bold">!</span>
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-warning mb-1.5">
                Slash Warning
              </p>
              <p className="text-xs font-mono text-on-surface-muted leading-relaxed">
                Staked collateral is committed to the SlashingJudge. Fraudulent output will result in immediate automated forfeiture.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ n, label, active }: { n: number; label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-2 transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`}>
      <div className={`w-5 h-5 flex items-center justify-center text-[10px] font-mono font-bold border ${active ? 'border-primary text-primary' : 'border-border text-on-surface-dim'}`}>
        {n}
      </div>
      <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

function InfoCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-5 bg-surface-container border border-border">
      <div className="flex items-center gap-3 mb-2.5">
        {icon}
        <h4 className="text-[11px] font-display font-bold uppercase tracking-widest text-on-surface">
          {title}
        </h4>
      </div>
      <p className="text-xs font-mono text-on-surface-muted leading-relaxed">{desc}</p>
    </div>
  );
}
