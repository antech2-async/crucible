'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrustChartProps {
  data: {
    taskIndex: number;
    trustScore: number;
    multiplier: number;
  }[];
}

const GOLD = '#FFD700';
const GOLD_DIM = '#ffe792';

export default function TrustChart({ data }: TrustChartProps) {
  return (
    <div className="w-full h-[280px] bg-surface-container border border-border p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted">
          Trust Score History
        </h3>
        <div className="flex gap-4">
          <LegendItem label="Trust Score" color={GOLD} />
          <LegendItem label="Required Stake" color={GOLD_DIM} dim />
        </div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTrust" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={GOLD} stopOpacity={0.25} />
              <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorMulti" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={GOLD_DIM} stopOpacity={0.08} />
              <stop offset="95%" stopColor={GOLD_DIM} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="#2a2825" vertical={false} />
          <XAxis dataKey="taskIndex" hide />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#4a4540', fontSize: 9, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="trustScore"
            stroke={GOLD}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorTrust)"
            animationDuration={1500}
          />
          <Area
            type="monotone"
            dataKey="multiplier"
            stroke={GOLD_DIM}
            strokeWidth={1}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#colorMulti)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function LegendItem({ label, color, dim }: { label: string; color: string; dim?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-px" style={{ backgroundColor: color, opacity: dim ? 0.5 : 1 }} />
      <span className="text-[9px] font-mono uppercase tracking-widest text-on-surface-dim">
        {label}
      </span>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-high border border-border p-3 text-xs font-mono">
        <p className="text-[9px] uppercase tracking-widest text-primary mb-2">
          Task #{payload[0].payload.taskIndex}
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-6">
            <span className="text-on-surface-muted uppercase text-[9px]">Trust Score</span>
            <span className="font-bold text-on-surface">{payload[0].value.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-on-surface-dim uppercase text-[9px]">Stake Multiplier</span>
            <span className="text-on-surface-muted">{payload[1].value.toFixed(2)}x</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
