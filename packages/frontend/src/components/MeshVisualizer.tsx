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

function idHash(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function gridPos(id: string, index: number, total: number) {
  const cols = Math.max(2, Math.ceil(Math.sqrt(total)));
  const rows = Math.ceil(total / cols);
  const col = index % cols;
  const row = Math.floor(index / cols);

  const h = idHash(id);
  const jX = ((h % 14) - 7);
  const jY = (((h >> 5) % 10) - 5);

  const cellW = 76 / cols;
  const cellH = 76 / rows;
  const bx = 12 + col * cellW + cellW / 2;
  const by = 12 + row * cellH + cellH / 2;

  return {
    x: Math.max(5, Math.min(95, bx + jX)),
    y: Math.max(5, Math.min(95, by + jY)),
  };
}

export function MeshVisualizer({ agents }: MeshVisualizerProps) {
  const nodes = useMemo(
    () =>
      agents.map((a, i) => ({
        ...a,
        pos: gridPos(a.id, i, agents.length),
        color: TIER_COLOR[a.tier] ?? TIER_COLOR[0],
        label: `${a.id.slice(0, 6)}...${a.id.slice(-3)}`,
      })),
    [agents],
  );

  const edges = useMemo(() => {
    const result: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.pos.x - b.pos.x;
        const dy = a.pos.y - b.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Connect nearby nodes (within ~40 units) of same or adjacent tier
        if (dist < 40 && Math.abs(a.tier - b.tier) <= 1) {
          result.push({ x1: a.pos.x, y1: a.pos.y, x2: b.pos.x, y2: b.pos.y });
        }
      }
    }
    return result;
  }, [nodes]);

  if (agents.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-[9px] font-mono uppercase tracking-widest text-on-surface-dim animate-pulse">
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
      <defs>
        <pattern id="dotgrid" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="0.5" cy="0.5" r="0.25" fill="rgba(255,215,0,0.07)" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#dotgrid)" />

      {/* Edges */}
      {edges.map((e, i) => (
        <line
          key={i}
          x1={e.x1} y1={e.y1}
          x2={e.x2} y2={e.y2}
          stroke="rgba(255,215,0,0.12)"
          strokeWidth="0.25"
        />
      ))}

      {/* Nodes */}
      {nodes.map((node) => (
        <g key={node.id}>
          {node.tier >= 3 && (
            <circle cx={node.pos.x} cy={node.pos.y} r="2" fill="none"
              stroke={node.color} strokeWidth="0.3" opacity="0.25">
              <animate attributeName="r" values="2;3.5;2" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.25;0;0.25" dur="3s" repeatCount="indefinite" />
            </circle>
          )}
          <circle
            cx={node.pos.x} cy={node.pos.y}
            r={node.tier >= 3 ? '1.2' : '0.9'}
            fill={node.status === 'slashed' ? '#F44336' : node.color}
            opacity={node.status === 'slashed' ? 0.5 : 0.85}
          />
          <text
            x={node.pos.x + 1.8} y={node.pos.y - 1.5}
            fontSize="2"
            fill="rgba(138,128,112,0.65)"
            fontFamily="var(--font-mono,monospace)"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
