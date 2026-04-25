import Arena from '@/components/Arena';

export default function Home() {
  return (
    <div className="w-full">
      <div className="mb-10">
        <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-on-surface mb-1">
          Swarm <span className="text-primary">Arena</span>
        </h1>
        <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-on-surface-muted">
          <span>Active Coordination Pool</span>
          <span>·</span>
          <span className="text-primary/70">0G Galileo Testnet</span>
        </div>
      </div>

      <Arena />

      <div className="mt-16 pt-5 border-t border-border flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-on-surface-dim">
        <p>Crucible Protocol v0.1.0-alpha</p>
        <p>Secured by 0G TEE Inference &amp; Storage</p>
      </div>
    </div>
  );
}
