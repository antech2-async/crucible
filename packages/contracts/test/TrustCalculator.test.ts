import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { TrustCalculator } from '../typechain-types';

describe('TrustCalculator', () => {
  let calculator: TrustCalculator;

  beforeEach(async () => {
    const TrustCalculator = await ethers.getContractFactory('TrustCalculator');
    calculator = await TrustCalculator.deploy();
  });

  describe('calculateTrustTier', () => {
    it('returns tier 0 for new agent with < 3 tasks', async () => {
      // Despite perfect record, 2 tasks is insufficient history
      expect(await calculator.calculateTrustTier(2, 2, 2, 0, 0)).to.equal(0);
      expect(await calculator.calculateTrustTier(1, 1, 1, 0, 0)).to.equal(0);
      expect(await calculator.calculateTrustTier(0, 0, 0, 0, 0)).to.equal(0);
    });

    it('returns tier 4 for agent with 95%+ weighted score', async () => {
      // 10 tasks all passed, recent window 10/10, no slashes
      // Lifetime = 100%, Recent = 100%, Weighted = 100% -> Tier 4
      expect(await calculator.calculateTrustTier(10, 10, 10, 0, 0)).to.equal(4);
    });

    it('drops tier when slash events accumulate', async () => {
      // Perfect base history: 10 tasks, 10 recent
      // weightedScore = 10000.
      // 1 slash = penalty 500. final = 9500 -> Tier 4
      expect(await calculator.calculateTrustTier(10, 10, 10, 1, 0)).to.equal(4);
      expect(await calculator.calculateTrustTier(10, 10, 10, 2, 0)).to.equal(3);
      expect(await calculator.calculateTrustTier(10, 10, 10, 3, 0)).to.equal(3);
      expect(await calculator.calculateTrustTier(10, 10, 10, 6, 0)).to.equal(2);
      expect(await calculator.calculateTrustTier(10, 10, 10, 10, 0)).to.equal(1);
      expect(await calculator.calculateTrustTier(10, 10, 10, 11, 0)).to.equal(0);
    });

    it('calculates weighted score correctly (60% recent, 40% lifetime)', async () => {
      // Scenario: Experienced agent but recent performance is poor
      // total = 100, honestly = 100 (lifetime = 100%)
      // recent = 0 (recent = 0%)
      // weighted = 0.6 * 0 + 0.4 * 100 = 40% (4000 bp)
      // Tier 0
      expect(await calculator.calculateTrustTier(100, 100, 0, 0, 0)).to.equal(0);
      expect(await calculator.calculateTrustTier(100, 10, 10, 0, 0)).to.equal(1);
    });

    it('caps external agents at tier 3', async () => {
      // 10 tasks all passed, recent window 10/10, no slashes
      // Lifetime = 100%, Recent = 100%, Weighted = 100% -> Should objectively be Tier 4
      // But agentClass = 1 (EXTERNAL) means cap at Tier 3
      expect(await calculator.calculateTrustTier(10, 10, 10, 0, 1)).to.equal(3);
    });
  });

  describe('getStakeMultiplier', () => {
    it('returns strict multipliers for risk pricing', async () => {
      expect(await calculator.getStakeMultiplier(4)).to.equal(5000); // 0.5x
      expect(await calculator.getStakeMultiplier(3)).to.equal(7500); // 0.75x
      expect(await calculator.getStakeMultiplier(2)).to.equal(10000); // 1x
      expect(await calculator.getStakeMultiplier(1)).to.equal(15000); // 1.5x
      expect(await calculator.getStakeMultiplier(0)).to.equal(25000); // 2.5x
    });
  });
});
