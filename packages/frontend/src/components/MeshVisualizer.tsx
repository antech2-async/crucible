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
  4: '#FFB000',
  3: '#71D7CD',
  2: '#FFD597',
  1: '#FFB4AB',
  0: '#7f725f',
};

const DEMO_AGENTS: Agent[] = [
  { id: 'SENTINEL_PRIME', tier: 4, score: 0.99, status: 'idle' },
  { id: 'FORGE_MASTER', tier: 3, score: 0.84, status: 'working' },
  { id: 'RELAY_ALPHA', tier: 4, score: 0.94, status: 'idle' },
  { id: 'ORACLE_77X', tier: 2, score: 0.78, status: 'working' },
  { id: 'ARCHIVE_NOVA', tier: 3, score: 0.88, status: 'idle' },
  { id: 'CIPHER_NODE', tier: 4, score: 0.97, status: 'idle' },
];

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
  const jX = (h % 14) - 7;
  const jY = ((h >> 5) % 10) - 5;

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
  const visualAgents = agents.length > 0 ? agents : DEMO_AGENTS;

  const nodes = useMemo(
    () =>
      visualAgents.map((a, i) => ({
        ...a,
        pos: gridPos(a.id, i, visualAgents.length),
        color: TIER_COLOR[a.tier] ?? TIER_COLOR[0],
        label: `${a.id.slice(0, 6)}...${a.id.slice(-3)}`,
      })),
    [visualAgents],
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

  return (
    <div className="relative h-full w-full overflow-hidden mesh-haze">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(20,19,18,0.18)_42%,rgba(20,19,18,0.58)_100%)]" />
      <svg
        viewBox="0 0 100 100"
        className="relative z-10 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="mesh-glow">
            <feGaussianBlur stdDeviation="1.4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {edges.map((e, i) => (
          <g key={i}>
            <line
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke="rgba(255,213,151,0.12)"
              strokeWidth="0.22"
            />
            <line
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke="rgba(113,215,205,0.45)"
              strokeDasharray="1.8 6"
              strokeLinecap="round"
              strokeWidth="0.22"
              className="opacity-0 transition-opacity duration-300 group-hover/mesh:opacity-100"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;-15"
                dur={`${2.8 + i * 0.18}s`}
                repeatCount="indefinite"
              />
            </line>
          </g>
        ))}

        {nodes.map((node, index) => (
          <g key={node.id} filter="url(#mesh-glow)">
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`0 0;${index % 2 === 0 ? 0.7 : -0.6} ${index % 3 === 0 ? -0.5 : 0.45};0 0`}
              dur={`${5.2 + index * 0.35}s`}
              repeatCount="indefinite"
            />
            <circle
              cx={node.pos.x}
              cy={node.pos.y}
              r={node.tier >= 3 ? '2.2' : '1.8'}
              fill="none"
              stroke={node.color}
              strokeWidth="0.28"
              opacity="0.16"
            >
              <animate
                attributeName="r"
                values="1.8;3.4;1.8"
                dur={`${3 + index * 0.25}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.16;0;0.16"
                dur={`${3 + index * 0.25}s`}
                repeatCount="indefinite"
              />
            </circle>
            <circle
              cx={node.pos.x}
              cy={node.pos.y}
              r={node.tier >= 3 ? '0.88' : '0.72'}
              fill={node.status === 'slashed' ? '#FFB4AB' : node.color}
              opacity={node.status === 'slashed' ? 0.65 : 0.95}
            >
              <animate
                attributeName="opacity"
                values={node.status === 'slashed' ? '0.5;0.8;0.5' : '0.78;1;0.78'}
                dur={`${2.4 + index * 0.22}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}
