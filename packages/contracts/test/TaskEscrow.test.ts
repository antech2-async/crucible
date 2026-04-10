import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { TaskEscrow } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('TaskEscrow', () => {
  let escrow: TaskEscrow;
  let owner: SignerWithAddress;
  let poster: SignerWithAddress;
  let agent1: SignerWithAddress;
  let agent2: SignerWithAddress;
  let assignmentEngine: SignerWithAddress;
  let slashingJudge: SignerWithAddress;

  beforeEach(async () => {
    [owner, poster, agent1, agent2, assignmentEngine, slashingJudge] = await ethers.getSigners();
    const TaskEscrowFactory = await ethers.getContractFactory('TaskEscrow');
    escrow = await TaskEscrowFactory.deploy(owner.address);

    await escrow.setSlashingJudge(slashingJudge.address);
    await escrow.setAssignmentEngine(assignmentEngine.address);
  });

  describe('postTask', () => {
    it('allows posting a task with escrowed funds', async () => {
      const payment = ethers.parseEther('1.0');
      
      await expect(
        escrow.connect(poster).postTask(3600000000, ethers.encodeBytes32String('hash'), 'ipfs://criteriaURI', { value: payment })
      ).to.emit(escrow, 'TaskPosted').withArgs(0, poster.address, payment);

      const task = await escrow.tasks(0);
      expect(task.poster).to.equal(poster.address);
      expect(task.totalPayment).to.equal(payment);
      expect(task.status).to.equal(0); // OPEN
    });

    it('reverts if no payment sent', async () => {
      await expect(
        escrow.connect(poster).postTask(3600000000, ethers.encodeBytes32String('hash'), 'uri', { value: 0 })
      ).to.be.revertedWith('Payment required');
    });
  });

  describe('assignAgents', () => {
    beforeEach(async () => {
      await escrow.connect(poster).postTask(3600000000, ethers.encodeBytes32String('hash'), 'ipfs://criteriaURI', { value: ethers.parseEther('1.0') });
    });

    it('allows assignment engine to assign agents with stakes', async () => {
      const stakes = [ethers.parseEther('0.1'), ethers.parseEther('0.1')];
      
      await expect(
        escrow.connect(assignmentEngine).assignAgents(0, [agent1.address, agent2.address], stakes, { value: ethers.parseEther('0.2') })
      ).to.emit(escrow, 'AgentsAssigned');

      const task = await escrow.tasks(0);
      expect(task.status).to.equal(1); // ASSIGNED
    });

    it('reverts if unauthorized caller assigns', async () => {
      await expect(
        escrow.connect(agent1).assignAgents(0, [agent1.address], [ethers.parseEther('0.1')], { value: ethers.parseEther('0.1') })
      ).to.be.revertedWith('Only assignment engine');
    });
  });

  describe('submitOutput', () => {
    beforeEach(async () => {
      await escrow.connect(poster).postTask(3600000000, ethers.encodeBytes32String('hash'), 'ipfs://criteriaURI', { value: ethers.parseEther('1.0') });
      await escrow.connect(assignmentEngine).assignAgents(0, [agent1.address, agent2.address], [ethers.parseEther('0.1'), ethers.parseEther('0.1')], { value: ethers.parseEther('0.2') });
    });

    it('allows assigned agent to submit output with stake', async () => {
      await expect(
        escrow.connect(agent1).submitOutput(0, '0xOutputHash', '0x')
      ).to.emit(escrow, 'OutputSubmitted').withArgs(0, agent1.address, '0xOutputHash');
    });

    it('reverts if already submitted', async () => {
      await escrow.connect(agent1).submitOutput(0, '0xOutputHash', '0x');
      await expect(
        escrow.connect(agent1).submitOutput(0, 'hash', '0x')
      ).to.be.revertedWith('Already submitted');
    });
  });

  describe('Resolve Tasks', () => {
     beforeEach(async () => {
      await escrow.connect(poster).postTask(3600000000, ethers.encodeBytes32String('hash'), 'uri', { value: ethers.parseEther('1.0') });
      await escrow.connect(assignmentEngine).assignAgents(0, [agent1.address], [ethers.parseEther('0.1')], { value: ethers.parseEther('0.1') });
      await escrow.connect(agent1).submitOutput(0, 'hash', '0x');
    });

    it('resolves task and pays agent', async () => {
       const initialBalance = await ethers.provider.getBalance(agent1.address);
       
       await escrow.connect(slashingJudge).resolveTask(0, [true], [ethers.parseEther('1.0')]);

       const finalBalance = await ethers.provider.getBalance(agent1.address);
       expect(finalBalance).to.be.greaterThan(initialBalance);
       const task = await escrow.tasks(0);
       expect(task.status).to.equal(3); // COMPLETED
    });

    it('slashes agent and resolves', async () => {
       await expect(
          escrow.connect(slashingJudge).resolveTask(0, [false], [ethers.parseEther('0')])
       ).to.emit(escrow, 'AgentSlashed');

       const task = await escrow.tasks(0);
       expect(task.status).to.equal(3); // COMPLETED
    });
  });

  describe('failConsensus (Deadline Trap)', () => {
      beforeEach(async () => {
         await escrow.connect(poster).postTask(3600000000, ethers.encodeBytes32String('hash'), 'uri', { value: ethers.parseEther('1.0') });
         await escrow.connect(assignmentEngine).assignAgents(0, [agent1.address], [ethers.parseEther('0.1')], { value: ethers.parseEther('0.1') });
         // Agent MUST submit output to push status to VERIFYING so failConsensus can be called!
         await escrow.connect(agent1).submitOutput(0, 'hash', '0x');
      });

      it('forces failure if deadline trap triggered', async () => {
         await expect(
            escrow.connect(slashingJudge).failConsensus(0)
         ).to.emit(escrow, 'TaskFailed').withArgs(0, "Consensus loss");

         const task = await escrow.tasks(0);
         expect(task.status).to.equal(5); // FAILED
      });
  });
});
