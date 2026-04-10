import AgentRegistryABI from '../../contracts/artifacts/contracts/AgentRegistry.sol/AgentRegistry.json';
import TaskEscrowABI from '../../contracts/artifacts/contracts/TaskEscrow.sol/TaskEscrow.json';
import SlashingJudgeABI from '../../contracts/artifacts/contracts/SlashingJudge.sol/SlashingJudge.json';
import CrucibleINFTABI from '../../contracts/artifacts/contracts/CrucibleINFT.sol/CrucibleINFT.json';

export const AGENT_REGISTRY_ABI = AgentRegistryABI.abi;
export const TASK_ESCROW_ABI = TaskEscrowABI.abi;
export const SLASHING_JUDGE_ABI = SlashingJudgeABI.abi;
export const CRUCIBLE_INFT_ABI = CrucibleINFTABI.abi;

export const CONTRACT_ADDRESSES = {
  // These will be populated after the first deployment to Galileo Testnet
  AGENT_REGISTRY:
    process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000',
  TASK_ESCROW:
    process.env.NEXT_PUBLIC_ESCROW_ADDRESS || '0x0000000000000000000000000000000000000000',
  SLASHING_JUDGE:
    process.env.NEXT_PUBLIC_JUDGE_ADDRESS || '0x0000000000000000000000000000000000000000',
  CRUCIBLE_INFT:
    process.env.NEXT_PUBLIC_INFT_ADDRESS || '0x0000000000000000000000000000000000000000',
};
