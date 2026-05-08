'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[38px] w-[130px] animate-pulse rounded-lg bg-primary/20" />;
  }

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="rounded-lg border border-primary/40 px-4 py-2 font-display text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={() => connectors[0] && connect({ connector: connectors[0] })}
      className="rounded-lg bg-primary px-4 py-2 font-display text-sm font-bold text-on-primary shadow-[0_0_18px_rgba(255,176,0,0.12)] transition-colors hover:bg-primary-muted"
    >
      Connect Wallet
    </button>
  );
}
