'use client';

import React from 'react';
import { Gavel, AlertTriangle, ShieldCheck, History } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminHub() {
  // Mock data for the OCD-Grade Demo
  const disputedTasks = [
    {
      id: 'TASK-882',
      poster: '0x71C...392',
      agent: 'Agent-Crucible-05',
      stake: '0.015 ETH',
      reason: 'Output contains hallucinated CID',
      timestamp: '2 hours ago',
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
            <Gavel size={24} className="text-amber-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
              Admin Governance Hub
            </h1>
            <p className="text-xs text-amber-500/60 font-mono tracking-widest uppercase">
              Secure Slashing & Dispute Resolution Gate
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Disputes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400">
              Active Disputes
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest border border-red-500/20">
              Attention Required
            </span>
          </div>

          {disputedTasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-3xl p-8 border border-white/5 relative group"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-white mb-1">{task.id}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase">
                    <span>Poster: {task.poster}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-700" />
                    <span>{task.timestamp}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Slashed Stake At Risk</p>
                  <p className="text-xl font-black text-amber-400 font-mono">{task.stake}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 mb-8">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-500 shrink-0" size={18} />
                  <div>
                    <p className="text-xs font-bold text-red-200 uppercase tracking-wide mb-1">Grounds for Dispute</p>
                    <p className="text-sm text-gray-400 italic">"{task.reason}"</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="py-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                  Dismiss (No Action)
                </button>
                <button className="py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                  Finalize Slash
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats & Actions */}
        <div className="space-y-6">
          <div className="glass rounded-3xl p-6 border border-white/5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6 px-2">
              System Health
            </h3>
            <div className="space-y-4">
              <StatItem label="Total Slashed (Lifetime)" value="12.45 0G" />
              <StatItem label="Active Disputes" value="1" color="text-red-500" />
              <StatItem label="Resolved Integrity" value="99.2%" color="text-green-500" />
            </div>
            
            <button className="w-full mt-8 py-4 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600/20 transition-all flex items-center justify-center gap-2">
              <ShieldCheck size={14} /> Withdraw Yield
            </button>
          </div>

          <div className="glass rounded-3xl p-6 border border-white/5 overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 opacity-5">
              <History size={120} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-6 px-2">
              Recent Judgments
            </h3>
            <div className="space-y-4 relative z-10">
              <HistoryItem label="TASK-871" status="Dismissed" time="1d ago" />
              <HistoryItem label="TASK-865" status="Slashed" time="3d ago" color="text-red-500" />
              <HistoryItem label="TASK-842" status="Slashed" time="5d ago" color="text-red-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, color = "text-white" }: any) {
  return (
    <div className="flex justify-between items-end p-4 rounded-2xl bg-white/5 border border-white/5">
      <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">{label}</span>
      <span className={`text-lg font-black font-mono tracking-tighter ${color}`}>{value}</span>
    </div>
  );
}

function HistoryItem({ label, status, time, color = "text-gray-400" }: any) {
  return (
    <div className="flex justify-between items-center text-[10px] font-mono">
      <div className="flex items-center gap-3">
        <span className="text-white font-bold">{label}</span>
        <span className={color}>{status}</span>
      </div>
      <span className="text-gray-600">{time}</span>
    </div>
  );
}
