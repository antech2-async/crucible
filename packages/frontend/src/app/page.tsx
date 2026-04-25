import Arena from '@/components/Arena';

export default function Home() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-on-surface">
          Arena_Overview
        </h1>
        <p className="text-xs font-mono text-on-surface-muted mt-1.5 max-w-xl leading-relaxed">
          Centralized command interface for Crucible network coordination. Monitoring live agent mesh and on-chain throughput metrics.
        </p>
      </div>
      <Arena />
    </div>
  );
}
