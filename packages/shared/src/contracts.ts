import AgentRegistryABI from '../../contracts/artifacts/contracts/AgentRegistry.sol/AgentRegistry.json';
import TaskEscrowABI from '../../contracts/artifacts/contracts/TaskEscrow.sol/TaskEscrow.json';
import SlashingJudgeABI from '../../contracts/artifacts/contracts/SlashingJudge.sol/SlashingJudge.json';
import CrucibleINFTABI from '../../contracts/artifacts/contracts/CrucibleINFT.sol/CrucibleINFT.json';
import AgentStakeVaultABI from '../../contracts/artifacts/contracts/AgentStakeVault.sol/AgentStakeVault.json';

export const AGENT_REGISTRY_ABI = AgentRegistryABI.abi;
export const TASK_ESCROW_ABI = TaskEscrowABI.abi;
export const SLASHING_JUDGE_ABI = SlashingJudgeABI.abi;
export const CRUCIBLE_INFT_ABI = CrucibleINFTABI.abi;
export const AGENT_STAKE_VAULT_ABI = AgentStakeVaultABI.abi;

export const CONTRACT_ADDRESSES = {
  // Populated after deployment to 0G Galileo Testnet
  AGENT_REGISTRY:
    process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '0xB82008565FdC7e44609fA118A4a681E92581e680',
  TASK_ESCROW:
    process.env.NEXT_PUBLIC_ESCROW_ADDRESS || '0x8A93d247134d91e0de6f96547cB0204e5BE8e5D8',
  SLASHING_JUDGE:
    process.env.NEXT_PUBLIC_JUDGE_ADDRESS || '0x40918Ba7f132E0aCba2CE4de4c4baF9BD2D7D849',
  CRUCIBLE_INFT:
    process.env.NEXT_PUBLIC_INFT_ADDRESS || '0xF32D39ff9f6Aa7a7A64d7a4F00a54826Ef791a55',
  AGENT_STAKE_VAULT:
    process.env.NEXT_PUBLIC_VAULT_ADDRESS || '0xb9bEECD1A582768711dE1EE7B0A1d582D9d72a6C',
};
