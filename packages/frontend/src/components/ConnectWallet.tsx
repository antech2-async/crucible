'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[38px] w-[130px] animate-pulse rounded-lg bg-primary/20" />;
  }

  if (isConnected && address) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => disconnect()}
        isLoading={isDisconnecting}
        loadingText="Disconnecting"
        className="min-h-[38px] rounded-lg px-4 py-2 text-sm normal-case tracking-normal"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={() => connectors[0] && connect({ connector: connectors[0] })}
      disabled={!connectors[0]}
      isLoading={isConnecting}
      loadingText="Opening Wallet"
      className="min-h-[38px] rounded-lg px-4 py-2 text-sm normal-case tracking-normal shadow-[0_0_18px_rgba(255,176,0,0.12)]"
    >
      Connect Wallet
    </Button>
  );
}
