import { z } from 'zod';

export const envSchema = z.object({
  // 0G Network
  OG_RPC_URL: z.string().url().default('https://evmrpc-testnet.0g.ai'),
  OG_CHAIN_ID: z.coerce.number().default(16602),
  OG_STORAGE_INDEXER_URL: z.string().url(),

  // Wallet
  PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid Private Key format'),

  // Deployed Contract Addresses
  INFT_CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  REGISTRY_CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  ESCROW_CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  CALCULATOR_CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  JUDGE_CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),

  // 0G Compute
  OG_COMPUTE_PROVIDER_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  OG_MODEL: z.string().default('qwen-2.5-7b-instruct'),

  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error(
      '❌ Invalid environment variables:',
      JSON.stringify(result.error.format(), null, 2),
    );
    process.exit(1);
  }

  return result.data;
}
