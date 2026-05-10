import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { spawn } from 'child_process';

dotenv.config({ path: '../../.env' });

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.OG_RPC_URL;
  const escrowAddress = process.env.ESCROW_ADDRESS;

  if (!privateKey || !rpcUrl || !escrowAddress) {
    console.error('Missing environment variables. Check your .env file.');
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  const escrowContract = new ethers.Contract(
    escrowAddress,
    [
      'event AgentsAssigned(uint256 indexed taskId, address[] agents, uint256[] stakes)',
      'function getTaskBasic(uint256 taskId) external view returns (address poster, uint256 totalPayment, uint256 deadline, uint8 status, bytes32 criteriaHash, string memory criteriaURI, bool isSequential)',
    ],
    provider,
  );

  console.log('--- Crucible OpenClaw Listener ---');
  console.log('Agent Address:', signer.address);
  console.log('Listening for Crucible task assignments...');

  // Watch for assignment events
  escrowContract.on('AgentsAssigned', async (taskId, agents, _stakes) => {
    if (agents.includes(signer.address)) {
      console.log(`\n[!] TASK ASSIGNED: ID #${taskId.toString()}`);

      const task = await escrowContract.getTaskBasic(taskId);
      console.log(`    Criteria: ${task.criteriaURI}`);
      console.log(`    Deadline: ${new Date(Number(task.deadline) * 1000).toLocaleString()}`);

      console.log('    Triggering local execution (execute.ts)...');

      // Call execute.ts to perform the work and submit output
      const child = spawn('ts-node', ['execute.ts', taskId.toString()], {
        shell: true,
        env: { ...process.env },
      });

      child.stdout.on('data', (data) => console.log(`    [Execute]: ${data.toString().trim()}`));
      child.stderr.on('data', (data) => console.error(`    [Error]: ${data.toString().trim()}`));

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`    SUCCESS: Task #${taskId.toString()} completed and submitted.`);
        } else {
          console.error(`    FAILED: Task #${taskId.toString()} execution error.`);
        }
      });
    }
  });

  // Keep process alive
  process.stdin.resume();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
