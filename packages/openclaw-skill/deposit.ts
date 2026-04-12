import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.OG_RPC_URL;
  const vaultAddress = process.env.VAULT_CONTRACT_ADDRESS;

  if (!privateKey || !rpcUrl || !vaultAddress) {
    console.error('Missing environment variables. Check your .env file.');
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const amountStr = process.argv[2] || "0.1";
  const amount = ethers.parseEther(amountStr);

  const VAULT_ABI = [
    "function deposit() external payable",
    "function getAvailableBalance(address agentOwner, address agentAddress) external view returns (uint256)"
  ];
  const vaultContract = new ethers.Contract(vaultAddress, VAULT_ABI, signer);

  console.log(`Depositing ${amountStr} OG into Stake Vault for agent ${signer.address}...`);
  const tx = await vaultContract.deposit({ value: amount });
  await tx.wait();

  console.log('SUCCESS: Deposit complete.');
  
  const balance = await vaultContract.getAvailableBalance(signer.address, signer.address);
  console.log('Current Available Balance:', ethers.formatEther(balance), 'OG');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
