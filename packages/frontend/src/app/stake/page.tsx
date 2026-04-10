'use client';

import React, { useState } from 'react';
import { Coins, PlusCircle, ShieldCheck, Database, Rocket } from 'lucide-react';

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
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2 text-white">
          Agent <span className="text-blue-500">Staking</span> Portal
        </h1>
        <p className="text-xs font-mono text-gray-500 tracking-widest uppercase mb-8">
          Register New Node Identity & Commit Collateral
        </p>

        {/* Progress Stepper */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Step circle="1" label="Node Config" active={step >= 1} />
          <div className={`w-12 h-[1px] ${step >= 2 ? 'bg-blue-500' : 'bg-white/10'}`} />
          <Step circle="2" label="Storage Sync" active={step >= 2} />
          <div className={`w-12 h-[1px] ${step >= 3 ? 'bg-blue-500' : 'bg-white/10'}`} />
          <Step circle="3" label="On-Chain Commit" active={step >= 3} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div className="glass rounded-3xl p-8 border border-white/5 shadow-2xl">
          <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
            <PlusCircle size={16} className="text-blue-500" />
            Configure Identity
          </h3>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] block mb-2">
                Agent Name
              </label>
              <input
                type="text"
                placeholder="e.g. Swarm-Node-01"
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:border-blue-500/50 transition-all"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] block mb-2">
                Capabilities
              </label>
              <div className="flex flex-wrap gap-2">
                {['research', 'writing', 'coding', 'verification', 'data-sync'].map((cap) => (
                  <button
                    key={cap}
                    onClick={() => toggleCap(cap)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${formData.capabilities.includes(cap) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'}`}
                  >
                    {cap}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] block mb-2">
                Commit Stake (0G Tokens)
              </label>
              <div className="relative">
                <Coins
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                  size={16}
                />
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                  value={formData.stake}
                  onChange={(e) => setFormData({ ...formData, stake: e.target.value })}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                  Min 0.05
                </span>
              </div>
            </div>

            <button
              onMouseEnter={() => setStep(2)}
              onMouseLeave={() => setStep(1)}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-3"
            >
              Initialize Pipeline <Rocket size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <InfoCard
            icon={<Database className="text-blue-400" size={20} />}
            title="0G Storage Sync"
            desc="Your node's behavioral history will be initialized as a JSON object on 0G Storage with an immutable root hash."
          />
          <InfoCard
            icon={<ShieldCheck className="text-green-400" size={20} />}
            title="INFT Integration"
            desc="An Intelligent NFT (ERC-7857) will be minted as your permanent on-chain identity, carrying your encrypted capabilities."
          />
          <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <span className="text-amber-500 font-bold">!</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1">
                Slash Warning
              </p>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Staked collateral is committed to the SlashingJudge. Fraudulent output will result
                in immediate automated forfeiture.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ circle, label, active }: any) {
  return (
    <div
      className={`flex items-center gap-2 transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${active ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-500'}`}
      >
        {circle}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
  );
}

function InfoCard({ icon, title, desc }: any) {
  return (
    <div className="p-6 glass rounded-2xl border border-white/5">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h4 className="text-[11px] font-black uppercase tracking-widest text-white">{title}</h4>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
