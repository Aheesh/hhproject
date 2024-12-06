//script to connect to the pool and get pool tokens using the Controller contract getPoolTokens()
// Managed Pool Controller address required to run this script line 60

import hre from "hardhat";
import Contoller from "../artifacts/contracts/Controller.sol/Controller.json";
import { ethers } from "hardhat";

const func = async () => {
  console.log("Starting");
  const { deployments } = hre;
  //await deployments.fixture();
  const deployment = await deployments.get("Controller");
  console.log("Controller Address : ", deployment.address);
  const controller = await hre.ethers.getContractAt(
    "Controller",
    deployment.address
  );
  // const controllerAddress = await controller.getAddress();
  // console.log("Controller Address", controllerAddress);

  // Add verification steps
  console.log("Verifying contract...");
  const code = await hre.ethers.provider.getCode(deployment.address);
  if (code === "0x") {
    throw new Error("Contract not deployed at this address");
  }

  // Get pool ID first
  const poolId = await controller.getPoolId();
  console.log("Pool ID:", poolId);

  // Use Balancer Vault to get pool tokens instead
  const VAULT_ADDRESS = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"; // Balancer Vault
  const vault = await hre.ethers.getContractAt("IVault", VAULT_ADDRESS);
  
  try {
    const { tokens, balances, lastChangeBlock } = await vault.getPoolTokens(poolId);
    console.log("Pool Tokens:", tokens);
    console.log("Balances:", balances);
    console.log("Last Change Block:", lastChangeBlock);

    const [cash, managed, lastChangeBlock2, assetManager] =
      await controller.getPoolTokenInfo(tokens[4]);
    console.log("Cash balance: ", cash);
    console.log("Managed balance: ", managed);
    console.log("Last Change Block: ", lastChangeBlock2);
    console.log("Asset Manager: ", assetManager);
  } catch (error) {
    console.error("Failed to get pool tokens:", error);
    process.exit(1);
  }

  const [poolAddress, poolSpecialization] =
    await controller.getPoolSpecialization();
  console.log("Pool Address : ", poolAddress);
  console.log("Pool Specialization : ", poolSpecialization);

  const poolJoinExitEnabled = await controller.getJoinExitEnabled();
  console.log("Managed Pool Join Exit Enabled status", poolJoinExitEnabled);

  const managedPoolControllerAddress =
    "0x0763be8916ea5775020ee21eed25e54f4d15d5a8";
  console.log("Managed Pool Controller Address", managedPoolControllerAddress);
  const provider = hre.ethers.provider;
  const managedPoolContract = new ethers.Contract(
    managedPoolControllerAddress,
    Contoller.abi,
    provider
  );
  const managedPoolId = await managedPoolContract.getPoolId();
  console.log("Managed Pool Id", managedPoolId);

  const sender = await hre.getNamedAccounts();
  const signer = await ethers.getSigner(sender.deployer);
  console.log("Signer ===> ", sender.deployer);
  const managedPoolContractSigner = new ethers.Contract(
    managedPoolControllerAddress,
    Contoller.abi,
    signer
  );
  const poolJoinExitDisable =
    await managedPoolContractSigner.setJoinExitEnabled(true);
  // console.log("Join Disbaled", poolJoinExitDisable);

  const poolJoinExitEnabled2 = await controller.getJoinExitEnabled();
  console.log("Managed Pool Join Exit Enabled status", poolJoinExitEnabled2);

  let poolSwapStatus = await controller.getSwapEnabled();
  console.log("Swap Enabled status", poolSwapStatus);

  const poolSwapEnabled = await managedPoolContractSigner.setSwapEnabled(true);
  // console.log("Swap Enabled status", poolSwapEnabled);

  poolSwapStatus = await controller.getSwapEnabled();
  console.log("Swap Enabled status", poolSwapStatus);
};

try {
  console.log("Calling function");
  func();
} catch (error) {
  console.error("An error occurred:", error);
}
