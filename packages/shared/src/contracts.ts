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
    process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '0x32D5688843763F1d379c07Af936bD497884D6906',
  TASK_ESCROW:
    process.env.NEXT_PUBLIC_ESCROW_ADDRESS || '0x865862Dfa655B5635a35DEE9BD637F719730cA1a',
  SLASHING_JUDGE:
    process.env.NEXT_PUBLIC_JUDGE_ADDRESS || '0x74ACB64eAfb9Ac5a3Abad46C1DAb371351185C65',
  CRUCIBLE_INFT:
    process.env.NEXT_PUBLIC_INFT_ADDRESS || '0x278A6695a86FA86f9273e318e94a4Dea16dD6f9c',
  AGENT_STAKE_VAULT:
    process.env.NEXT_PUBLIC_VAULT_ADDRESS || '0x23CCB6B2B1a4bFd99aeB65f3cf1796d557fdb238',
};
