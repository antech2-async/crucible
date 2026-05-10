import AgentRegistryABI from './abis/AgentRegistry.json';
import TaskEscrowABI from './abis/TaskEscrow.json';
import SlashingJudgeABI from './abis/SlashingJudge.json';
import CrucibleINFTABI from './abis/CrucibleINFT.json';
import AgentStakeVaultABI from './abis/AgentStakeVault.json';

export const AGENT_REGISTRY_ABI = AgentRegistryABI;
export const TASK_ESCROW_ABI = TaskEscrowABI;
export const SLASHING_JUDGE_ABI = SlashingJudgeABI;
export const CRUCIBLE_INFT_ABI = CrucibleINFTABI;
export const AGENT_STAKE_VAULT_ABI = AgentStakeVaultABI;

export const CONTRACT_ADDRESSES = {
  // Populated after deployment to 0G Galileo Testnet
  AGENT_REGISTRY:
    process.env.REGISTRY_ADDRESS ||
    process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ||
    '0x20F1c04104c8BE5522D645BcA9E91E5Be41D6208',
  TASK_ESCROW:
    process.env.ESCROW_ADDRESS ||
    process.env.NEXT_PUBLIC_ESCROW_ADDRESS ||
    '0x8A93d247134d91e0de6f96547cB0204e5BE8e5D8',
  SLASHING_JUDGE:
    process.env.JUDGE_ADDRESS ||
    process.env.NEXT_PUBLIC_JUDGE_ADDRESS ||
    '0x40918Ba7f132E0aCba2CE4de4c4baF9BD2D7D849',
  CRUCIBLE_INFT:
    process.env.INFT_ADDRESS ||
    process.env.NEXT_PUBLIC_INFT_ADDRESS ||
    '0xF32D39ff9f6Aa7a7A64d7a4F00a54826Ef791a55',
  AGENT_STAKE_VAULT:
    process.env.VAULT_ADDRESS ||
    process.env.NEXT_PUBLIC_VAULT_ADDRESS ||
    '0xb9bEECD1A582768711dE1EE7B0A1d582D9d72a6C',
};
