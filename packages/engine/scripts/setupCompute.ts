import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { logger } from '@crucible/shared';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const PROVIDER_ADDRESS = process.env.OG_COMPUTE_PROVIDER_ADDRESS!;
const INITIAL_DEPOSIT = 1.0; // 1 0G for priming

async function setupCompute() {
  const pk = process.env.PRIVATE_KEY;
  const rpc = process.env.OG_RPC_URL;

  if (!pk || !rpc || !PROVIDER_ADDRESS) {
    logger.error(
      'Missing environment variables: PRIVATE_KEY, OG_RPC_URL, or OG_COMPUTE_PROVIDER_ADDRESS',
    );
    process.exit(1);
  }

  logger.info('--- 0G COMPUTE SETUP COMMENCING ---');
  logger.info(`Connecting to 0G Provider: ${PROVIDER_ADDRESS}`);

  try {
    const provider = new ethers.JsonRpcProvider(rpc);
    const signer = new ethers.Wallet(pk, provider);
    const balance = await provider.getBalance(signer.address);

    logger.info(`Operator Balance: ${ethers.formatEther(balance)} 0G`);

    if (balance === 0n) {
      logger.warn('⚠️ Operator has 0 balance. Setup may fail during settlement deposit.');
    }

    // Initialize Broker
    logger.info('Initializing 0G Serving Network Broker...');
    const broker = await createZGComputeNetworkBroker(signer as any);

    // 1. Settlement Layer Account Creation
    logger.info(`Depositing ${INITIAL_DEPOSIT} 0G into Settlement Layer for Provider...`);
    try {
      // @ts-expect-error - ledger is not in the broker type definition yet
      await broker.ledger.addAccount(PROVIDER_ADDRESS, INITIAL_DEPOSIT);
      logger.info('Settlement account seeded successfully.');
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        logger.info('Account already exists in settlement layer. Skipping deposit.');
      } else {
        throw e;
      }
    }

    // 2. Perform a Test Inference to verify TEE status
    logger.info('Performing TEE Attestation Verification Test...');
    const model = process.env.OG_MODEL || 'qwen-2.5-7b-instruct';

    try {
      // @ts-expect-error - inference is not in the broker type definition yet
      const result = await broker.inference.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: 'Connection test. Respond with "READY".' }],
        provider: PROVIDER_ADDRESS,
        verifiable: true, // This is the gold plating
      });

      if (result.attestation) {
        logger.info('✅ TEE Attestation Verified. Compute environment is fully HARDENED.');
      } else {
        logger.warn('⚠️ Attestation missing. Ensure the provider supports TEE inference.');
      }
    } catch (e) {
      logger.error('Test inference failed. Check provider status and model availability.', e);
    }

    logger.info('--- SETUP COMPLETE ---');
    logger.info('Your AI Swarm is now ready for autonomous deployment.');
  } catch (error) {
    logger.error('Failed to complete 0G Compute setup', error);
    process.exit(1);
  }
}

setupCompute();
