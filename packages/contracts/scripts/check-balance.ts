import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const [signer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(signer.address);
  console.log(`--- Account Check ---`);
  console.log(`Address: ${signer.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} OG`);
  
  if (balance === 0n) {
    console.log(`\n❌ ERROR: Your balance is 0. You need to fund this address at https://faucet.0g.ai/ before you can run seeding scripts.`);
  } else {
    console.log(`\n✅ You have enough funds to proceed.`);
  }
}

main().catch(console.error);
