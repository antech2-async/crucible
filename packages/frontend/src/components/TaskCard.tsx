'use client';

import React from 'react';
import { Target, Clock, ShieldCheck, ChevronRight } from 'lucide-react';

export default function TaskCard() {
  // Mock data for scaffolding
  const task = {
    id: '0x8F9...2E',
    poster: '0xA1...B4',
    payment: '0.05 0G',
    deadline: '1h 12m',
    status: 'VERIFYING',
    criteria: [
      { name: 'Word Count', value: '>= 500', passed: true },
      { name: 'Source Count', value: '>= 5', passed: true },
      { name: 'TEE Proof', value: 'Valid', passed: true },
    ],
  };

  return (
    <div className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
      {/* Background Decor */}
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-all rounded-full" />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-blue-500" />
            <h3 className="font-bold text-sm font-mono tracking-tight text-gray-200">
              Task {task.id}
            </h3>
          </div>
          <p className="text-[10px] text-gray-500 uppercase flex items-center gap-1 font-mono tracking-wider">
            From {task.poster}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-blue-400 tracking-tighter">{task.payment}</p>
          <div className="flex items-center justify-end gap-1 text-[10px] text-gray-500 uppercase tracking-widest font-mono">
            <Clock size={10} /> {task.deadline}
          </div>
        </div>
      </div>

      {/* Criteria Breakdown */}
      <div className="space-y-3 mb-6 bg-white/5 rounded-xl p-4">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
          Verification Criteria
        </p>
        {task.criteria.map((c, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className={c.passed ? 'text-green-500' : 'text-gray-500'} />
              <span className="text-xs text-gray-300">{c.name}</span>
            </div>
            <span className="text-xs font-mono text-gray-400 font-bold tracking-tight">
              {c.value}
            </span>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <button className="w-full py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all group/btn">
        View Full TEE Proof{' '}
        <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
      </button>

      {/* Bottom Status */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/20" />
        </div>
        <span className="text-[9px] font-bold text-blue-500 uppercase tracking-[0.2em]">
          Judgement in progress
        </span>
      </div>
    </div>
  );
}
