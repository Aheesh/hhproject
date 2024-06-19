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

  const ControllerAddress = "0x07F318c701Ac7561f2e0f6549ec8A5F43dCFfa9B";
  console.log("Checking token balance for address", ControllerAddress);
  const balance = await controller.balanceOf(ControllerAddress);
  console.log("TokenA Balance", balance);

  const deploymentB = await deployments.get("PlayerBToken");
  console.log("PlayerB Token Address : ", deploymentB.address);
  const controllerB = await ethers.getContractAt(
    "PlayerBToken",
    deploymentB.address
  );

  const balanceB = await controllerB.balanceOf(ControllerAddress);
  console.log("TokenB Balance", balanceB);

  const deploymentDrawToken = await deployments.get("DrawToken");
  console.log("Draw Token Address : ", deploymentDrawToken.address);
  const controllerDrawToken = await ethers.getContractAt(
    "DrawToken",
    deploymentDrawToken.address
  );
  const balanceDrawToken = await controllerDrawToken.balanceOf(
    ControllerAddress
  );
  console.log("Draw Token Balance", balanceDrawToken);

  const deploymentStableToken = await deployments.get("StableToken");
  console.log("Stable Token Address : ", deploymentStableToken.address);
  const controllerStableToken = await ethers.getContractAt(
    "StableToken",
    deploymentStableToken.address
  );
  const balanceStableToken = await controllerStableToken.balanceOf(
    ControllerAddress
  );
  console.log("Stable Token Balance", balanceStableToken);
}

try {
  console.log("Calling tokenCheck() function");
  tokenCheck();
} catch (error) {
  console.error("An error occurred:", error);
}
