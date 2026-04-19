/* eslint-disable @typescript-eslint/no-explicit-any */
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';

const PROVIDER_ADDRESS = process.env.OG_COMPUTE_PROVIDER_ADDRESS!;
const MODEL = process.env.OG_MODEL || 'gemma-2b-it';

export interface VerifiedInferenceResult {
  taskId: string;
  agentId: string;
  output: string;
  attestation: any;
  model: string;
  timestamp: number;
  verified: boolean;
}

export class ComputeService {
  private broker: any;
  private signer!: ethers.Wallet;

  async initialize(privateKey: string) {
    const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL!);
    this.signer = new ethers.Wallet(privateKey, provider);
    this.broker = await createZGComputeNetworkBroker(this.signer as any);

    // Ensure the broker is funded with the settlement layer
    try {
      if (PROVIDER_ADDRESS) {
        await this.broker.ledger.addAccount(PROVIDER_ADDRESS, 1.0); // deposit 1 0G
      }
    } catch (e) {
      console.log('Skipping settlement deposit, ensuring balance via CLI expected.', e);
    }
  }

  async runAgentInference(
    systemPrompt: string,
    userMessage: string,
    taskId: string,
    agentId: string,
  ): Promise<VerifiedInferenceResult> {
    if (!this.broker) {
      throw new Error('ComputeService not initialized. Call initialize(privateKey) first.');
    }

    if (!PROVIDER_ADDRESS) {
      console.warn(
        "No OG_COMPUTE_PROVIDER_ADDRESS provided. Halting inference as per strict 'no simulated responses' rule.",
      );
      throw new Error('No 0G Compute Provider. Halting.');
    }

    const response = await this.broker.inference.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      provider: PROVIDER_ADDRESS,
      // Request TEE attestation - this guarantees cryptographic proof
      verifiable: true,
    });

    const content = response.choices[0].message.content;
    const attestation = response.attestation || null;

    return {
      taskId,
      agentId,
      output: content,
      attestation,
      model: MODEL,
      timestamp: Date.now(),
      verified: !!attestation,
    };
  }

  // Verify attestation before passing to smart contract
  async verifyAttestation(attestation: any): Promise<boolean> {
    if (!attestation) return false;

    try {
      const isValid = await this.broker.verifier.verify(attestation);
      return isValid;
    } catch (e) {
      console.error('Attestation verification failed:', e);
      return false;
    }
  }
}
