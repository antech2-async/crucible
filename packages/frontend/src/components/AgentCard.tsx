'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import Link from 'next/link';
import { Award, AlertCircle, Cpu, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface AgentCardProps {
  agent: {
    id: string;
    tier: number;
    score: number;
    tasks: number;
    status: 'idle' | 'working' | 'slashed';
    window: number[];
    class: 'native' | 'external';
  };
}

const TIER_CONFIG: any = {
  4: {
    label: 'Mythic',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
    glow: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]',
  },
  3: {
    label: 'Epic',
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-400/10',
    border: 'border-fuchsia-400/30',
    glow: 'shadow-[0_0_15px_rgba(192,38,211,0.2)]',
  },
  2: {
    label: 'Rare',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/30',
    glow: 'shadow-[0_0_15px_rgba(37,99,235,0.2)]',
  },
  1: {
    label: 'Uncommon',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/30',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
  },
  0: {
    label: 'Basic',
    color: 'text-slate-400',
    bg: 'bg-slate-400/10',
    border: 'border-slate-400/30',
    glow: 'shadow-none',
  },
};

export default function AgentCard({ agent }: AgentCardProps) {
  const config = TIER_CONFIG[agent.tier] || TIER_CONFIG[0];
  const isSlashed = agent.status === 'slashed';

  return (
    <Link href={`/agents/${agent.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`relative group glass rounded-2xl p-6 border border-white/5 cursor-pointer overflow-hidden ${
          isSlashed
            ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
            : `hover:border-white/20 ${config.glow}`
        }`}
      >
        {/* Status Glow */}
        <div
          className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity rounded-full ${isSlashed ? 'bg-red-500' : 'bg-blue-500'}`}
        />

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                {agent.class === 'native' ? 'Native INFT' : 'External Agent'}
              </p>
              <div className={`w-1.5 h-1.5 rounded-full ${agent.class === 'native' ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-orange-400 opacity-60'}`} />
            </div>
            <h3 className="font-bold text-lg font-mono tracking-tight group-hover:text-white transition-colors">
              {agent.id}
            </h3>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${config.bg} ${config.color} border ${config.border} shadow-sm backdrop-blur-md`}
          >
            {config.label}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Trust XP</p>
              <div
                className={`text-3xl font-black tracking-tighter flex items-center gap-2 ${config.color}`}
              >
                {(agent.score * 100).toFixed(1)}%
                {agent.tier >= 3 && (
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Award size={20} className="filter drop-shadow-md" />
                  </motion.div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase font-mono">Tasks: {agent.tasks}</p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${agent.score * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full bg-gradient-to-r from-transparent via-white/20 to-current ${config.color.replace('text-', 'bg-')}`}
            />
          </div>
        </div>

        {/* Consistency Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-[9px] uppercase text-gray-500 tracking-wider">
            <span>Recent Performance</span>
            <span>Last 10 Actions</span>
          </div>
          <div className="flex gap-1.5 h-1.5 w-full">
            {Array.from({ length: 10 }).map((_, i) => {
              const result = agent.window[i];
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-full ${
                    result === undefined
                      ? 'bg-gray-800'
                      : result === 1
                        ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                        : 'bg-red-500 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Action Area */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${isSlashed ? 'bg-red-500/20' : 'bg-blue-500/10'}`}>
              {isSlashed ? (
                <AlertCircle size={14} className="text-red-500" />
              ) : (
                <Cpu size={14} className="text-blue-500" />
              )}
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${isSlashed ? 'text-red-400' : 'text-blue-400'}`}
            >
              {isSlashed ? 'Slashed' : agent.status === 'working' ? 'Processing' : agent.class === 'native' ? 'TEE Verified' : 'Hash Committed'}
            </span>
          </div>

          <motion.div
            whileHover={{ x: 3 }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Zap size={14} className="text-white/40" />
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
}
