'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { getErrorMessage } from '@/lib/api';

export type ContractActionStep =
  | 'idle'
  | 'preparing'
  | 'wallet-confirm'
  | 'pending-chain'
  | 'success'
  | 'failed';

type ContractActionOptions = {
  onConfirmed?: (hash: `0x${string}`) => void;
};

export function useContractAction(options: ContractActionOptions = {}) {
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [prepareLabel, setPrepareLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const notifiedHashRef = useRef<`0x${string}` | undefined>();

  const { writeContractAsync, isPending: isWalletPending } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!hash || !receipt.isSuccess || notifiedHashRef.current === hash) return;
    notifiedHashRef.current = hash;
    options.onConfirmed?.(hash);
  }, [hash, options, receipt.isSuccess]);

  const execute = useCallback(
    async (request: any, prepare?: () => Promise<void> | void) => {
      try {
        setError(null);
        setHash(undefined);
        notifiedHashRef.current = undefined;

        if (prepare) {
          setPrepareLabel('Preparing transaction data');
          await prepare();
        }

        setPrepareLabel(null);
        const nextHash = await writeContractAsync(request);
        setHash(nextHash);
        return nextHash;
      } catch (err) {
        setPrepareLabel(null);
        setError(getErrorMessage(err, 'Transaction failed'));
        throw err;
      }
    },
    [writeContractAsync],
  );

  const reset = useCallback(() => {
    setHash(undefined);
    setError(null);
    setPrepareLabel(null);
    notifiedHashRef.current = undefined;
  }, []);

  const step: ContractActionStep = useMemo(() => {
    if (error || receipt.isError) return 'failed';
    if (prepareLabel) return 'preparing';
    if (isWalletPending) return 'wallet-confirm';
    if (receipt.isLoading) return 'pending-chain';
    if (receipt.isSuccess) return 'success';
    return 'idle';
  }, [error, isWalletPending, prepareLabel, receipt.isError, receipt.isLoading, receipt.isSuccess]);

  return {
    error: error ?? (receipt.error ? getErrorMessage(receipt.error) : null),
    execute,
    hash,
    isBusy: step === 'preparing' || step === 'wallet-confirm' || step === 'pending-chain',
    prepareLabel,
    reset,
    step,
  };
}

export function getContractActionLabel(step: ContractActionStep) {
  if (step === 'preparing') return 'Preparing data';
  if (step === 'wallet-confirm') return 'Confirm in wallet';
  if (step === 'pending-chain') return 'Waiting for chain';
  if (step === 'success') return 'Confirmed';
  if (step === 'failed') return 'Failed';
  return 'Ready';
}
