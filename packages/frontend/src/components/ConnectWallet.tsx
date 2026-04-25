'use client';

import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest border border-primary/50 text-primary hover:bg-primary/10 transition-colors"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={() => connectors[0] && connect({ connector: connectors[0] })}
      className="px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest bg-primary text-on-primary hover:bg-primary-muted transition-colors"
    >
      Connect Wallet
    </button>
  );
}
