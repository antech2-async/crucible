import { ethers } from 'ethers';
import { logger } from '@crucible/shared';

/**
 * CostTracker (Technical Spec Section 18)
 * Tracks the economic sustainability of the coordination engine.
 * Records estimated storage expenditures vs. actual protocol fee revenue.
 */
export class CostTracker {
  private static instance: CostTracker;
  private storageSpend: bigint = 0n;
  private protocolFees: bigint = 0n;

  private constructor() {}

  public static getInstance(): CostTracker {
    if (!CostTracker.instance) {
      CostTracker.instance = new CostTracker();
    }
    return CostTracker.instance;
  }

  /**
   * Records a storage write cost (typically ~0.001 OG per transaction in demo)
   */
  recordStorageWrite(costEth: string = '0.001') {
    this.storageSpend += ethers.parseEther(costEth);
  }

  /**
   * Records the 2% protocol fee collected from a slash or task completion.
   */
  recordFee(feeWei: bigint) {
    this.protocolFees += feeWei;
  }

  /**
   * Returns the net profit/loss of the engine.
   */
  getNetRevenue(): string {
    const net = this.protocolFees - this.storageSpend;
    return ethers.formatEther(net);
  }

  /**
   * Logs a comprehensive audit report for the administrator.
   */
  logAudit() {
    const net = this.protocolFees - this.storageSpend;
    const status = net >= 0n ? 'PROFITABLE' : 'SUBSIDIZED';
    
    logger.info({
      storageSpend: ethers.formatEther(this.storageSpend) + ' OG',
      protocolFees: ethers.formatEther(this.protocolFees) + ' OG',
      netRevenue: ethers.formatEther(net) + ' OG',
      status: status
    }, '--- Protocol Cost Audit (Section 18) ---');
  }
}

export const costTracker = CostTracker.getInstance();
