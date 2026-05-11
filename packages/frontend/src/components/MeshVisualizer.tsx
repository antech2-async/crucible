'use client';

import React, { useMemo } from 'react';

interface Agent {
  id: string;
  tier: number;
  score: number;
  status: 'idle' | 'working' | 'slashed' | 'offline';
  tasks?: number;
  class?: string;
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

const MESH_CENTER = { x: 75, y: 36 };
const MESH_BOUNDS = { minX: 18, maxX: 132, minY: 12, maxY: 64 };
const NODE_FIELD_SCALE = 0.78;

function idHash(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function shortId(value: string) {
  if (!value.startsWith('0x')) return value.length > 12 ? `${value.slice(0, 9)}...` : value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function rankedPos(id: string, index: number, total: number) {
  if (total === 1) return MESH_CENTER;

  const anchors = [
    MESH_CENTER,
    { x: 42, y: 24 },
    { x: 108, y: 24 },
    { x: 52, y: 55 },
    { x: 98, y: 55 },
  ];
  const h = idHash(id);
  const anchor = anchors[index] ?? anchors[anchors.length - 1];
  const jitter = index === 0 ? 0 : 4.5;

  return {
    x: Math.max(
      MESH_BOUNDS.minX,
      Math.min(MESH_BOUNDS.maxX, anchor.x + ((h % 100) / 100 - 0.5) * jitter),
    ),
    y: Math.max(
      MESH_BOUNDS.minY,
      Math.min(MESH_BOUNDS.maxY, anchor.y + (((h >> 5) % 100) / 100 - 0.5) * jitter),
    ),
  };
}

export function MeshVisualizer({ agents }: MeshVisualizerProps) {
  const nodes = useMemo(
    () =>
      agents.slice(0, 5).map((a, i) => ({
        ...a,
        rank: i + 1,
        pos: rankedPos(a.id, i, agents.length),
        color: TIER_COLOR[a.tier] ?? TIER_COLOR[0],
        label: shortId(a.id),
        scoreLabel: `${(a.score * 100).toFixed(1)}%`,
        shell: a.class === 'native' ? 'INFT' : 'EXT',
      })),
    [agents],
  );

  const edges = useMemo(() => {
    const result: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const [prime, ...wing] = nodes;

    if (!prime) return result;

    wing.forEach((node) => {
      result.push({
        x1: prime.pos.x,
        y1: prime.pos.y,
        x2: node.pos.x,
        y2: node.pos.y,
      });
    });

    for (let i = 1; i < nodes.length - 1; i++) {
      const a = nodes[i];
      const b = nodes[i + 1];
      if (a && b) {
        result.push({ x1: a.pos.x, y1: a.pos.y, x2: b.pos.x, y2: b.pos.y });
      }
    }

    return result;
  }, [nodes]);

  const nodeFieldTransform = `translate(${MESH_CENTER.x} ${MESH_CENTER.y}) scale(${NODE_FIELD_SCALE}) translate(${-MESH_CENTER.x} ${-MESH_CENTER.y})`;

  return (
    <div className="relative h-full w-full overflow-hidden mesh-haze">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(113,215,205,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,213,151,0.035)_1px,transparent_1px)] bg-[size:34px_34px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(20,19,18,0.18)_42%,rgba(20,19,18,0.58)_100%)]" />

      {!nodes.length ? (
        <div className="relative z-20 flex h-full items-center justify-center px-8">
          <div className="relative grid h-36 w-full max-w-sm place-items-center overflow-hidden rounded-lg border border-dashed border-border-strong/20 bg-surface/25">
            <div className="absolute h-28 w-28 rounded-full border border-secondary/15" />
            <div className="absolute h-16 w-16 rounded-full border border-primary/15" />
            <div className="readout-pulse h-px w-40 bg-gradient-to-r from-transparent via-secondary/60 to-transparent" />
            <div className="absolute bottom-5 rounded border border-border-strong/15 bg-surface-low/75 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-on-surface-muted/55">
              Awaiting registered agents
            </div>
          </div>
        </div>
      ) : null}

      <svg
        viewBox="0 0 150 74"
        className="relative z-10 h-full w-full overflow-visible"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <style>
            {`
              .mesh-node {
                cursor: pointer;
              }

              .mesh-node-shell,
              .mesh-node-card,
              .mesh-node-rank,
              .mesh-node-data {
                transition: opacity 180ms ease, stroke-width 180ms ease, filter 180ms ease;
              }

              .mesh-node-hover-ring {
                opacity: 0;
                transition: opacity 180ms ease;
              }

              .mesh-node:hover .mesh-node-hover-ring {
                opacity: 0.72;
              }

              .mesh-node:hover .mesh-node-shell {
                stroke-width: 0.62;
                filter: drop-shadow(0 0 4px currentColor);
              }

              .mesh-node:hover .mesh-node-card {
                opacity: 1;
                stroke-width: 0.28;
              }

              .mesh-node:hover .mesh-node-rank,
              .mesh-node:hover .mesh-node-data {
                opacity: 1;
              }
            `}
          </style>
          <filter id="mesh-glow">
            <feGaussianBlur stdDeviation="1.4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="mesh-prime-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,213,151,0.35)" />
            <stop offset="55%" stopColor="rgba(113,215,205,0.16)" />
            <stop offset="100%" stopColor="rgba(113,215,205,0)" />
          </radialGradient>
          <linearGradient id="mesh-link" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,176,0,0.05)" />
            <stop offset="50%" stopColor="rgba(113,215,205,0.65)" />
            <stop offset="100%" stopColor="rgba(255,213,151,0.08)" />
          </linearGradient>
        </defs>

        <g opacity="0.38">
          <circle
            cx={MESH_CENTER.x}
            cy={MESH_CENTER.y}
            r="11"
            fill="none"
            stroke="rgba(113,215,205,0.12)"
            strokeWidth="0.18"
          />
          <circle
            cx={MESH_CENTER.x}
            cy={MESH_CENTER.y}
            r="27"
            fill="none"
            stroke="rgba(255,213,151,0.09)"
            strokeWidth="0.16"
          />
          <circle
            cx={MESH_CENTER.x}
            cy={MESH_CENTER.y}
            r="45"
            fill="none"
            stroke="rgba(113,215,205,0.08)"
            strokeWidth="0.14"
          />
          <line
            x1="10"
            x2="140"
            y1={MESH_CENTER.y}
            y2={MESH_CENTER.y}
            stroke="rgba(113,215,205,0.08)"
            strokeWidth="0.14"
          />
          <line
            x1={MESH_CENTER.x}
            x2={MESH_CENTER.x}
            y1="4"
            y2="70"
            stroke="rgba(255,213,151,0.08)"
            strokeWidth="0.14"
          />
          <path
            d={`M ${MESH_CENTER.x} ${MESH_CENTER.y} L ${MESH_CENTER.x} 3 A 45 45 0 0 1 108 16 Z`}
            fill="rgba(113,215,205,0.09)"
            className="origin-center"
          >
            <animateTransform
              attributeName="transform"
              dur="8s"
              from={`0 ${MESH_CENTER.x} ${MESH_CENTER.y}`}
              repeatCount="indefinite"
              to={`360 ${MESH_CENTER.x} ${MESH_CENTER.y}`}
              type="rotate"
            />
          </path>
        </g>

        <g transform={nodeFieldTransform}>
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
                stroke="url(#mesh-link)"
                strokeDasharray="2 4"
                strokeLinecap="round"
                strokeWidth="0.32"
                className="opacity-35 transition-opacity duration-300 group-hover/mesh:opacity-100"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;-15"
                  dur={`${2.8 + i * 0.18}s`}
                  repeatCount="indefinite"
                />
              </line>
              <circle r="0.42" fill={i % 2 === 0 ? '#71D7CD' : '#FFD597'} opacity="0.72">
                <animateMotion
                  dur={`${3.2 + i * 0.22}s`}
                  path={`M ${e.x1} ${e.y1} L ${e.x2} ${e.y2}`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}

          {nodes.map((node, index) => (
            <g
              key={node.id}
              className="mesh-node transition-opacity duration-300 hover:opacity-100"
              filter="url(#mesh-glow)"
            >
              <title>
                {node.label} rank {node.rank}, score {node.scoreLabel}, tier {node.tier}
              </title>
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
                r={index === 0 ? '15.5' : '11.5'}
                fill={index === 0 ? 'url(#mesh-prime-core)' : node.color}
                opacity={index === 0 ? '0.5' : '0.08'}
              />
              <circle
                className="mesh-node-hover-ring"
                cx={node.pos.x}
                cy={node.pos.y}
                r={index === 0 ? '9.8' : '7.4'}
                fill="none"
                stroke={node.color}
                strokeDasharray="1.2 1.6"
                strokeWidth="0.28"
              >
                <animateTransform
                  attributeName="transform"
                  dur="2.6s"
                  from={`0 ${node.pos.x} ${node.pos.y}`}
                  repeatCount="indefinite"
                  to={`360 ${node.pos.x} ${node.pos.y}`}
                  type="rotate"
                />
              </circle>
              <circle
                cx={node.pos.x}
                cy={node.pos.y}
                r={index === 0 ? '7' : node.tier >= 3 ? '5.4' : '4.8'}
                fill="none"
                stroke={node.color}
                strokeWidth="0.36"
                opacity="0.22"
              >
                <animate
                  attributeName="r"
                  values={`${index === 0 ? 6.4 : 4.2};${index === 0 ? 12.2 : 8.4};${index === 0 ? 6.4 : 4.2}`}
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
              <path
                className="mesh-node-shell"
                d={`M ${node.pos.x - (index === 0 ? 4.6 : 3.6)} ${node.pos.y - (index === 0 ? 5.3 : 4.2)} L ${node.pos.x + (index === 0 ? 4.6 : 3.6)} ${node.pos.y - (index === 0 ? 5.3 : 4.2)} L ${node.pos.x + (index === 0 ? 5.8 : 4.5)} ${node.pos.y} L ${node.pos.x + (index === 0 ? 4.6 : 3.6)} ${node.pos.y + (index === 0 ? 5.3 : 4.2)} L ${node.pos.x - (index === 0 ? 4.6 : 3.6)} ${node.pos.y + (index === 0 ? 5.3 : 4.2)} L ${node.pos.x - (index === 0 ? 5.8 : 4.5)} ${node.pos.y} Z`}
                fill="rgba(20,19,18,0.72)"
                stroke={node.color}
                strokeWidth="0.42"
              />
              <circle
                cx={node.pos.x}
                cy={node.pos.y}
                r={index === 0 ? '1.55' : '1.15'}
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
              <text
                className="mesh-node-rank select-none font-mono text-[2.25px] font-bold uppercase tracking-widest opacity-80"
                x={node.pos.x}
                y={node.pos.y - (index === 0 ? 8.3 : 6.8)}
                textAnchor="middle"
                fill={node.color}
              >
                #{node.rank} {node.shell}
              </text>
              <g>
                <rect
                  className="mesh-node-card"
                  x={node.pos.x - 12.2}
                  y={node.pos.y + (index === 0 ? 8.3 : 6.7)}
                  width="24.4"
                  height="8.2"
                  rx="1"
                  fill="rgba(20,19,18,0.82)"
                  stroke="rgba(255,213,151,0.16)"
                  strokeWidth="0.15"
                />
                <text
                  className="mesh-node-data select-none font-mono text-[1.95px] font-bold uppercase opacity-90"
                  x={node.pos.x}
                  y={node.pos.y + (index === 0 ? 11.15 : 9.55)}
                  textAnchor="middle"
                  fill="rgba(230,226,223,0.86)"
                >
                  {node.label}
                </text>
                <text
                  className="mesh-node-data select-none font-mono text-[1.65px] font-bold uppercase opacity-90"
                  x={node.pos.x}
                  y={node.pos.y + (index === 0 ? 13.75 : 12.15)}
                  textAnchor="middle"
                  fill={node.score >= 0.8 ? '#71D7CD' : '#FFD597'}
                >
                  {node.scoreLabel} / T{node.tier}
                </text>
              </g>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
