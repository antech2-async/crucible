'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Target, Clock, ShieldCheck, ChevronRight, Binary } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden group shadow-xl"
    >
      {/* Background Decor */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-all rounded-full pointer-events-none" />

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
          <motion.div
            key={i}
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div
                className={c.passed ? 'p-1 rounded bg-green-500/10' : 'p-1 rounded bg-gray-500/10'}
              >
                {c.name === 'TEE Proof' ? (
                  <Binary size={12} className={c.passed ? 'text-green-500' : 'text-gray-500'} />
                ) : (
                  <ShieldCheck
                    size={12}
                    className={c.passed ? 'text-green-500' : 'text-gray-500'}
                  />
                )}
              </div>
              <span className="text-[11px] text-gray-300 font-medium">{c.name}</span>
            </div>
            <span className="text-[11px] font-mono text-gray-400 font-bold tracking-tight bg-white/5 px-2 py-0.5 rounded border border-white/5">
              {c.value}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Action Button */}
      <button className="w-full py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all group/btn">
        View Full TEE Proof{' '}
        <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
      </button>

      {/* Bottom Status */}
      <div className="mt-4 flex items-center justify-center gap-3 py-2 border-t border-white/5">
        <div className="flex gap-1.5 items-center">
          <motion.span
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"
          />
          <span className="w-1 h-1 rounded-full bg-blue-400/30" />
          <span className="w-1 h-1 rounded-full bg-blue-400/20" />
        </div>
        <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] font-mono animate-pulse-glow">
          Judgement Processing
        </span>
      </div>
    </motion.div>
  );
}
