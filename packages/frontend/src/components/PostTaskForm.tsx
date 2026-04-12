'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { PlusCircle, Database, Coins, Clock, CheckCircle2, Send, Loader2 } from 'lucide-react';
import { parseEther } from 'viem';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, TASK_ESCROW_ABI } from '@crucible/shared';

export default function PostTaskForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

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
      // 1. In a real integration, we'd call an API route that uses our StorageService
      // to upload the JSON to 0G Storage and returned the Merkle root.
      // For this hackathon demo, we'll simulate the URI/Hash generation.
      const mockCriteriaURI = `0g://tasks/${Math.random().toString(36).substring(7)}`;
      const mockCriteriaHash = '0x' + 'a'.repeat(64); // Simulation of the Merkle Root

      const deadlineSeconds =
        Math.floor(Date.now() / 1000) + parseInt(formData.deadlineHours) * 3600;

      // 2. Call TaskEscrow.postTask
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
      <div className="p-12 glass rounded-3xl border border-green-500/30 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
          <CheckCircle2 className="text-green-500" size={32} />
        </div>
        <h3 className="text-2xl font-black italic uppercase text-white mb-2">Task Ingested</h3>
        <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">
          Escrow Locked • Indexing on 0G Storage...
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-8 px-8 py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 hover:bg-white/10 transition-all"
        >
          Create Another
        </button>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-8 border border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Database size={100} />
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-600/10 rounded-lg">
          <PlusCircle size={20} className="text-blue-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold italic uppercase tracking-tight text-white">
            Post New Task
          </h2>
          <p className="text-[10px] text-gray-500 uppercase font-mono tracking-widest">
            Commission Verified AI Swarm
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] block mb-2 px-1">
            Research Topic
          </label>
          <input
            required
            type="text"
            placeholder="e.g. 0G Storage vs Arweave Data Availability"
            className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:border-blue-500/50 transition-all"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] block mb-2 px-1">
              Budget (0G)
            </label>
            <div className="relative">
              <input
                required
                type="number"
                step="0.01"
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-4 pr-10 text-sm font-bold focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
              <Coins
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={14}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] block mb-2 px-1">
              Deadline (Hours)
            </label>
            <div className="relative">
              <input
                required
                type="number"
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-4 pr-10 text-sm font-bold focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                value={formData.deadlineHours}
                onChange={(e) => setFormData({ ...formData, deadlineHours: e.target.value })}
              />
              <Clock
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={14}
              />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
          <p className="text-[9px] font-black uppercase text-blue-500 tracking-[0.2em] mb-4">
            Autonomous Verification Policy (OCD Builder)
          </p>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Minimum Result Length
                </span>
                <span className="text-xs font-mono font-bold text-blue-400">{formData.minWords} Words</span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                value={formData.minWords}
                onChange={(e) => setFormData({ ...formData, minWords: e.target.value })}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Source Integrity Check
                </span>
                <span className="text-xs font-mono font-bold text-cyan-400">{formData.minSources} Links</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                value={formData.minSources}
                onChange={(e) => setFormData({ ...formData, minSources: e.target.value })}
              />
            </div>
          </div>
        </div>

        <button
          disabled={loading || isConfirming}
          type="submit"
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-[0.3em] text-xs shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading || isConfirming ? (
            <>
              Initializing Swarm <Loader2 className="animate-spin" size={16} />
            </>
          ) : (
            <>
              Seal Escrow & Deploy <Send size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function CriteriaRange({ label, value, unit }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className="text-xs font-mono font-bold text-gray-300">
        {value} {unit}
      </span>
    </div>
  );
}
