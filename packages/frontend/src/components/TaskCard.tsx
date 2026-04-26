'use client';

import React from 'react';
import { Target, Clock, ShieldCheck, ChevronRight, Binary } from 'lucide-react';
import { Surface } from '@/components/ui';

export default function TaskCard() {
  const task = {
    id: '0x8F9...2E',
    poster: '0xA1...B4',
    payment: '0.05 0G',
    deadline: '1h 12m',
    status: 'VERIFYING',
    criteria: [
      { name: 'Word Count',  value: '>= 500', passed: true },
      { name: 'Source Count',value: '>= 5',   passed: true },
      { name: 'TEE Proof',   value: 'Valid',  passed: true },
    ],
  };

  return (
    <Surface level="container" className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={12} className="text-primary/60" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-on-surface">
              Task {task.id}
            </h3>
          </div>
          <p className="text-[9px] font-mono uppercase tracking-widest text-on-surface-dim">
            From {task.poster}
          </p>
        </div>
        <div className="text-right">
          <p className="text-base font-mono font-bold text-primary">{task.payment}</p>
          <div className="flex items-center justify-end gap-1 text-[9px] font-mono uppercase text-on-surface-dim">
            <Clock size={9} /> {task.deadline}
          </div>
        </div>
      </div>

      {/* Criteria */}
      <div className="bg-surface-low border border-border p-3 mb-4 space-y-2.5">
        <p className="text-[9px] font-mono uppercase tracking-widest text-on-surface-muted mb-1.5">
          Verification Criteria
        </p>
        {task.criteria.map((c, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {c.name === 'TEE Proof' ? (
                <Binary size={11} className={c.passed ? 'text-success' : 'text-on-surface-dim'} />
              ) : (
                <ShieldCheck size={11} className={c.passed ? 'text-success' : 'text-on-surface-dim'} />
              )}
              <span className="text-[10px] font-mono text-on-surface-muted">{c.name}</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-on-surface bg-surface border border-border px-2 py-0.5">
              {c.value}
            </span>
          </div>
        ))}
      </div>

      {/* Action */}
      <button className="w-full py-2.5 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
        View Full TEE Proof <ChevronRight size={12} />
      </button>

      {/* Status */}
      <div className="mt-3 flex items-center justify-center gap-2 pt-3 border-t border-border">
        <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
        <span className="text-[9px] font-mono uppercase tracking-widest text-primary/70">
          Judgement Processing
        </span>
      </div>
    </Surface>
  );
}
