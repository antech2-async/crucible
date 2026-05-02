import Arena from '@/components/Arena';

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className="mb-8">
        <h1 className="mb-2 font-display text-3xl font-black uppercase tracking-tight text-on-surface md:text-4xl">
          ARENA_OVERVIEW
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-on-surface-muted/80">
          Centralized command interface for Crucible network coordination. Monitoring live agent
          mesh and industrial throughput metrics.
        </p>
      </div>
      <Arena />
    </div>
  );
}
