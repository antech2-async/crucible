'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { PlusCircle, Coins, Clock, CheckCircle2, Send, Loader2 } from 'lucide-react';
import { parseEther } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, TASK_ESCROW_ABI } from '@crucible/shared';
import { Surface, SectionHeader, Button } from '@/components/ui';

export default function PostTaskForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [formData, setFormData] = useState({
    topic: '',
    budget: '0.05',
    deadlineHours: '24',
    minWords: '500',
    minSources: '5',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const mockCriteriaURI = `0g://tasks/${Math.random().toString(36).substring(7)}`;
      const mockCriteriaHash = '0x' + 'a'.repeat(64);
      const deadlineSeconds = Math.floor(Date.now() / 1000) + parseInt(formData.deadlineHours) * 3600;
      writeContract({
        address: CONTRACT_ADDRESSES.TASK_ESCROW as `0x${string}`,
        abi: TASK_ESCROW_ABI,
        functionName: 'postTask',
        args: [BigInt(deadlineSeconds), mockCriteriaHash as `0x${string}`, mockCriteriaURI],
        value: parseEther(formData.budget),
      });
    } catch (err) {
      console.error('Failed to post task', err);
    } finally {
      setLoading(false);
    }
  };

  if (isConfirmed || success) {
    return (
      <Surface level="container" className="p-10 flex flex-col items-center text-center border-success/30">
        <div className="w-12 h-12 border border-success/40 flex items-center justify-center mb-5">
          <CheckCircle2 className="text-success" size={24} />
        </div>
        <h3 className="text-base font-display font-bold uppercase tracking-widest text-on-surface mb-1">
          Task Ingested
        </h3>
        <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted">
          Escrow Locked · Indexing on 0G Storage...
        </p>
        <Button variant="ghost" size="sm" className="mt-7" onClick={() => setSuccess(false)}>
          Create Another
        </Button>
      </Surface>
    );
  }

  return (
    <Surface level="container" className="p-6">
      <SectionHeader
        title="Post New Task"
        subtitle="Commission Verified AI Swarm"
        action={<PlusCircle size={16} className="text-primary/60" />}
        className="mb-6"
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted block mb-1.5">
            Research Topic
          </label>
          <input
            required
            type="text"
            placeholder="e.g. 0G Storage vs Arweave Data Availability"
            className="w-full bg-surface-low border border-border py-2.5 px-3 text-sm font-mono text-on-surface placeholder:text-on-surface-dim focus:outline-none focus:border-primary transition-colors"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted block mb-1.5">
              Budget (0G)
            </label>
            <div className="relative">
              <input
                required
                type="number"
                step="0.01"
                className="w-full bg-surface-low border border-border py-2.5 pl-3 pr-9 text-sm font-mono text-on-surface focus:outline-none focus:border-primary transition-colors"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
              <Coins className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-dim" size={13} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted block mb-1.5">
              Deadline (Hours)
            </label>
            <div className="relative">
              <input
                required
                type="number"
                className="w-full bg-surface-low border border-border py-2.5 pl-3 pr-9 text-sm font-mono text-on-surface focus:outline-none focus:border-primary transition-colors"
                value={formData.deadlineHours}
                onChange={(e) => setFormData({ ...formData, deadlineHours: e.target.value })}
              />
              <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-dim" size={13} />
            </div>
          </div>
        </div>

        <div className="p-4 bg-surface-low border border-border">
          <p className="text-[9px] font-mono uppercase tracking-widest text-primary mb-4">
            Autonomous Verification Policy
          </p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted">
                  Min Result Length
                </span>
                <span className="text-[10px] font-mono font-bold text-primary">{formData.minWords} Words</span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                className="w-full h-px bg-border appearance-none cursor-pointer accent-[#FFD700]"
                value={formData.minWords}
                onChange={(e) => setFormData({ ...formData, minWords: e.target.value })}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted">
                  Source Integrity Check
                </span>
                <span className="text-[10px] font-mono font-bold text-primary">{formData.minSources} Links</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                className="w-full h-px bg-border appearance-none cursor-pointer accent-[#FFD700]"
                value={formData.minSources}
                onChange={(e) => setFormData({ ...formData, minSources: e.target.value })}
              />
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          className="w-full py-3 justify-center"
          type="submit"
          disabled={loading || isConfirming}
        >
          {loading || isConfirming ? (
            <>Initializing Swarm <Loader2 className="animate-spin" size={14} /></>
          ) : (
            <>Seal Escrow &amp; Deploy <Send size={14} /></>
          )}
        </Button>
      </form>
    </Surface>
  );
}
