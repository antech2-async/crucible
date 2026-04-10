import Arena from '@/components/Arena';

export default function Home() {
  return (
    <div className="w-full">
      <div className="mb-12">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">
          Swarm <span className="text-blue-500">Arena</span>
        </h1>
        <div className="flex items-center gap-4 text-xs font-mono text-gray-500 tracking-widest uppercase">
          <span>Active Coordination Pool</span>
          <span>•</span>
          <span className="text-blue-400">0G Galileo Testnet</span>
        </div>
      </div>

      <Arena />

      <div className="mt-20 pt-8 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-gray-600 uppercase tracking-[0.2em]">
        <p>Crucible Protocol v0.1.0-alpha</p>
        <p>Secured by 0G TEE Inference & Storage</p>
      </div>
    </div>
  );
}
