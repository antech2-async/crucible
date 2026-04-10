import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. Deploy AgentRegistry
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();
  console.log("AgentRegistry deployed to:", await registry.getAddress());

  // 2. Deploy TrustCalculator
  const TrustCalculator = await ethers.getContractFactory("TrustCalculator");
  const calculator = await TrustCalculator.deploy();
  await calculator.waitForDeployment();
  console.log("TrustCalculator deployed to:", await calculator.getAddress());

  // 3. Deploy TaskEscrow
  const TaskEscrow = await ethers.getContractFactory("TaskEscrow");
  const escrow = await TaskEscrow.deploy(deployer.address);
  await escrow.waitForDeployment();
  console.log("TaskEscrow deployed to:", await escrow.getAddress());

  // 4. Deploy SlashingJudge
  const SlashingJudge = await ethers.getContractFactory("SlashingJudge");
  const judge = await SlashingJudge.deploy(
    await registry.getAddress(),
    await escrow.getAddress(),
    await calculator.getAddress()
  );
  await judge.waitForDeployment();
  console.log("SlashingJudge deployed to:", await judge.getAddress());

  // 5. Deploy CrucibleINFT
  const CrucibleINFT = await ethers.getContractFactory("CrucibleINFT");
  const inft = await CrucibleINFT.deploy(deployer.address);
  await inft.waitForDeployment();
  console.log("CrucibleINFT deployed to:", await inft.getAddress());

  // 6. Set authorizations
  console.log("Setting authorizations...");
  await registry.addAuthorizedUpdater(await judge.getAddress());
  await escrow.setSlashingJudge(await judge.getAddress());
  await escrow.setAssignmentEngine(deployer.address); // Deployer acts as engine for demo

  console.log("Deployment complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
