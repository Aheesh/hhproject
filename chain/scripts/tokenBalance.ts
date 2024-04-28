//Script to check the token balance for a wallet address

import hre from "hardhat";
import { ethers } from "hardhat";

async function tokenCheck() {
  const deployments = await hre.deployments;
  const deployment = await deployments.get("PlayerAToken");
  console.log("PlayerA Token Address : ", deployment.address);
  const controller = await ethers.getContractAt(
    "PlayerAToken",
    deployment.address
  );

  const LPAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  console.log("Checking token balance for address", LPAddress);
  const balance = await controller.checkBalance(LPAddress);
  console.log("TokenA Balance", balance);

  const deploymentB = await deployments.get("PlayerBToken");
  console.log("PlayerB Token Address : ", deploymentB.address);
  const controllerB = await ethers.getContractAt(
    "PlayerBToken",
    deploymentB.address
  );

  const balanceB = await controllerB.checkBalance(LPAddress);
  console.log("TokenB Balance", balanceB);
}

try {
  console.log("Calling tokenCheck() function");
  tokenCheck();
} catch (error) {
  console.error("An error occurred:", error);
}
