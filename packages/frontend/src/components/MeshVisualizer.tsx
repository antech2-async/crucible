'use client';

import React, { useMemo } from 'react';

interface Agent {
  id: string;
  tier: number;
  score: number;
  status: 'idle' | 'working' | 'slashed';
}

interface MeshVisualizerProps {
  agents: Agent[];
}

const TIER_COLOR: Record<number, string> = {
  4: '#FFD700',
  3: '#4CAF50',
  2: '#FF9800',
  1: '#F44336',
  0: '#4a4540',
};

function deterministicPos(id: string, tier: number, score: number) {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) + hash + id.charCodeAt(i)) | 0;
  }
  const jitterX = ((Math.abs(hash) % 20) - 10);
  const jitterY = ((Math.abs(hash >> 4) % 12) - 6);

  // X: trust score maps left→right (5–92)
  const baseX = 5 + score * 87;
  // Y: tier maps top→bottom (elite=top, low=bottom) with inversion
  const tierBaseY: Record<number, number> = { 4: 12, 3: 32, 2: 55, 1: 75, 0: 88 };
  const baseY = tierBaseY[tier] ?? 70;

  return {
    x: Math.max(4, Math.min(96, baseX + jitterX)),
    y: Math.max(4, Math.min(96, baseY + jitterY)),
  };
}

export function MeshVisualizer({ agents }: MeshVisualizerProps) {
  const nodes = useMemo(
    () =>
      agents.map((a) => ({
        ...a,
        pos: deterministicPos(a.id, a.tier, a.score),
        color: TIER_COLOR[a.tier] ?? TIER_COLOR[0],
        label: `${a.id.slice(0, 8)}...${a.id.slice(-3)}`,
      })),
    [agents],
  );

  const edges = useMemo(() => {
    const result: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const sameTier = a.tier === b.tier && a.tier >= 2;
        const proximate = Math.abs(a.score - b.score) < 0.12 && a.score > 0.55;
        if (sameTier || proximate) {
          result.push({
            x1: a.pos.x,
            y1: a.pos.y,
            x2: b.pos.x,
            y2: b.pos.y,
            opacity: Math.min(a.score, b.score) * 0.4,
          });
        }
      }
    }
    return result;
  }, [nodes]);

  if (agents.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-dim animate-pulse">
          Scanning 0G Network...
        </p>
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Dot grid background */}
      <defs>
        <pattern id="dotgrid" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="0.5" cy="0.5" r="0.3" fill="rgba(255,215,0,0.06)" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#dotgrid)" />

      {/* Connection lines */}
      {edges.map((e, i) => (
        <line
          key={i}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          stroke="rgba(255,215,0,0.15)"
          strokeWidth="0.3"
          opacity={e.opacity}
        />
      ))}

      {/* Agent dots */}
      {nodes.map((node) => (
        <g key={node.id}>
          {/* Pulse ring for elite agents */}
          {node.tier >= 3 && (
            <circle
              cx={node.pos.x}
              cy={node.pos.y}
              r="2.5"
              fill="none"
              stroke={node.color}
              strokeWidth="0.4"
              opacity="0.3"
            >
              <animate attributeName="r" values="2.5;4;2.5" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
            </circle>
          )}
          {/* Main dot */}
          <circle
            cx={node.pos.x}
            cy={node.pos.y}
            r={node.status === 'slashed' ? '1.2' : '1.5'}
            fill={node.status === 'slashed' ? '#F44336' : node.color}
            opacity={node.status === 'slashed' ? 0.5 : 0.9}
          />
          {/* Label */}
          <text
            x={node.pos.x + 2.2}
            y={node.pos.y - 2}
            fontSize="2.2"
            fill="rgba(138,128,112,0.7)"
            fontFamily="var(--font-mono, monospace)"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
