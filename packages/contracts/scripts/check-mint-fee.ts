import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

async function main() {
  const inftAddress = '0xDaDcfb515FDe4fdb07BFdbBe87d031504A051f4d';
  const inft = await ethers.getContractAt('CrucibleINFT', inftAddress);
  const fee = await inft.mintFee();
  console.log(`Current Mint Fee: ${ethers.formatEther(fee)} OG`);
}

main().catch(console.error);
