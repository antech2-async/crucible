'use client';

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

export default function TrustChart({ data }: TrustChartProps) {
  return (
    <div className="w-full h-[300px] glass rounded-3xl p-6 border border-white/5 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/5 blur-[80px] rounded-full" />

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">
          Bayesian Trajectory Analysis
        </h3>
        <div className="flex gap-4">
          <LegendItem label="Trust Score" color="#3b82f6" />
          <LegendItem label="Stake Multiplier" color="#6366f1" opacity={0.2} />
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTrust" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorMulti" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
          <XAxis dataKey="taskIndex" hide />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 'bold' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="trustScore"
            stroke="#3b82f6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorTrust)"
            animationDuration={2000}
          />
          <Area
            type="monotone"
            dataKey="multiplier"
            stroke="#6366f1"
            strokeWidth={1}
            strokeDasharray="5 5"
            fillOpacity={1}
            fill="url(#colorMulti)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function LegendItem({
  label,
  color,
  opacity = 1,
}: {
  label: string;
  color: string;
  opacity?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, opacity }} />
      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-heavy border border-white/10 p-3 rounded-xl shadow-2xl">
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
          Task Record #{payload[0].payload.taskIndex}
        </p>
        <div className="space-y-1">
          <p className="text-xl font-bold flex items-center justify-between gap-4">
            <span className="text-gray-400 text-[10px] uppercase font-mono">Trust</span>
            {payload[0].value.toFixed(1)}%
          </p>
          <p className="text-xs font-bold text-gray-500 flex items-center justify-between gap-4">
            <span className="text-[10px] uppercase font-mono italic">Multiplier</span>
            {payload[1].value.toFixed(2)}x Stake
          </p>
        </div>
      </div>
    );
  }
  return null;
}
