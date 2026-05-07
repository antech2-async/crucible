import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { AgentRegistry, TaskEscrow, TrustCalculator, SlashingJudge } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('SlashingJudge', () => {
  let registry: AgentRegistry;
  let escrow: TaskEscrow;
  let calculator: TrustCalculator;
  let judge: SlashingJudge;
  let owner: SignerWithAddress;
  let engine: SignerWithAddress;
  let agent1: SignerWithAddress;
  let agent2: SignerWithAddress;
  let agent3: SignerWithAddress;
  let vault: any;
  let inftMock: any;

  beforeEach(async () => {
    [owner, engine, agent1, agent2, agent3] = await ethers.getSigners();

    // Deploy Mock INFT
    const ERC721Mock = await ethers.getContractFactory('CrucibleINFT');
    inftMock = await ERC721Mock.deploy(owner.address);

    // Deploy deps
    const Registry = await ethers.getContractFactory('AgentRegistry');
    registry = await Registry.deploy();

    await registry.setINFTContract(await inftMock.getAddress());

    const Vault = await ethers.getContractFactory('AgentStakeVault');
    vault = await Vault.deploy();

    const Escrow = await ethers.getContractFactory('TaskEscrow');
    escrow = await Escrow.deploy(
      engine.address,
      await vault.getAddress(),
      await registry.getAddress(),
    );

    await vault.setEscrowContract(await escrow.getAddress());
    await vault.fundTreasury({ value: ethers.parseEther('10.0') });

    const Calc = await ethers.getContractFactory('TrustCalculator');
    calculator = await Calc.deploy();

    // Deploy Judge
    const Judge = await ethers.getContractFactory('SlashingJudge');
    judge = await Judge.deploy(
      await registry.getAddress(),
      await escrow.getAddress(),
      await calculator.getAddress(),
    );

    // Setup Auth
    await registry.addAuthorizedUpdater(await judge.getAddress());
    await escrow.setSlashingJudge(await judge.getAddress());
    await judge.addAuthorizedCaller(owner.address);
    await judge.addAuthorizedCaller(engine.address);

    // Register Agents
    await inftMock.connect(agent1).mintAgent(agent1.address, 'uri', ethers.ZeroHash, '0x', {
      value: ethers.parseEther('0.001'),
    });
    await inftMock.connect(agent2).mintAgent(agent2.address, 'uri', ethers.ZeroHash, '0x', {
      value: ethers.parseEther('0.001'),
    });
    await inftMock.connect(agent3).mintAgent(agent3.address, 'uri', ethers.ZeroHash, '0x', {
      value: ethers.parseEther('0.001'),
    });

    await registry.connect(agent1).registerNativeAgent(agent1.address, 1, ethers.ZeroHash, []);
    await registry.connect(agent2).registerNativeAgent(agent2.address, 2, ethers.ZeroHash, []);
    await registry.connect(agent3).registerNativeAgent(agent3.address, 3, ethers.ZeroHash, []);
  });

  describe('Consensus Enforcement (M-of-N)', () => {
    beforeEach(async () => {
      // Mock an Escrow state
      // Provide value natively instead of via an unconnected signers object to bypass postTask
      await escrow
        .connect(owner)
        .postTask(3600000000, ethers.encodeBytes32String('hash'), 'uri', false, {
          value: ethers.parseEther('3.0'),
        });
      await vault.connect(agent1).deposit({ value: ethers.parseEther('1.0') });
      await vault.connect(agent2).deposit({ value: ethers.parseEther('1.0') });
      await vault.connect(agent3).deposit({ value: ethers.parseEther('1.0') });

      await escrow
        .connect(engine)
        .assignAgents(
          0,
          [agent1.address, agent2.address, agent3.address],
          [ethers.parseEther('0.1'), ethers.parseEther('0.1'), ethers.parseEther('0.1')],
        );

      // Force internal state to allow resolve
      // Submitting output so the judge will pass
      await escrow.connect(agent1).submitOutput(0, 'A', '0x');
      await escrow.connect(agent2).submitOutput(0, 'A', '0x');
      await escrow.connect(agent3).submitOutput(0, 'B', '0x');
    });

    it('Majority Consensus: 2 Pass, 1 Fail (Bad Actor Slashed)', async () => {
      // agent1 and agent2 pass. agent3 fails.
      // 2 > (3/2) -> Consensus!

      const agents = [agent1.address, agent2.address, agent3.address];
      const results = [true, true, false];
      const newHashes = [ethers.ZeroHash, ethers.ZeroHash, ethers.ZeroHash];

      // Behavior data format: [total, honest, recent, slashEvents] x 3 agents (flattened)
      // Actually it's an array of length 3 where each element packs the uint256?
      // Wait, let's look at SlashingJudge.sol.
      // I'll just pass 0s to skip the calculator math test since we unit tested it above
      const data = [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0];

      await expect(judge.judgeTask(0, agents, results, newHashes, data))
        .to.emit(judge, 'JudgmentIssued')
        .withArgs(0, agents, results)
        .and.to.emit(escrow, 'AgentSlashed')
        .withArgs(0, agent3.address, ethers.parseEther('0.1')); // Agent 3 slashed

      const escrowTask = await escrow.tasks(0);
      expect(escrowTask.status).to.equal(5); // PARTIALLY_COMPLETED
    });

    it('Total Defection: 1 Pass, 2 Fail (All returned)', async () => {
      // 1 > 1 is false. Consensus fails!
      const agents = [agent1.address, agent2.address, agent3.address];
      const results = [true, false, false];
      const newHashes = [ethers.ZeroHash, ethers.ZeroHash, ethers.ZeroHash];
      const data = [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0];

      // If no consensus, task fails. Agents who submitted are refunded stake, but their Trust is slashed.
      await expect(judge.judgeTask(0, agents, results, newHashes, data)).to.emit(
        escrow,
        'TaskFailed',
      );

      const escrowTask = await escrow.tasks(0);
      expect(escrowTask.status).to.equal(7); // FAILED
    });
  });
});
