//Script to approve address to spend token

import hre from "hardhat";
import { ethers } from "hardhat";
import { Address } from "hardhat-deploy/types";

async function approveToken() {
  const deployments = await hre.deployments;
  const deployment = await deployments.get("PlayerAToken");
  console.log("PlayerA Token Address : ", deployment.address);
  const controller = await ethers.getContractAt(
    "PlayerAToken",
    deployment.address
  );

  //const LPAddress: Address = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
  const LPAddress: Address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const tx = await controller.approve(LPAddress, 1000000000000000000n);
  console.log("tx", tx);

  const deploymentB = await deployments.get("PlayerBToken");
  console.log("PlayerB Token Address : ", deploymentB.address);
  const controllerB = await ethers.getContractAt(
    "PlayerBToken",
    deploymentB.address
  );

  const txB = await controllerB.approve(LPAddress, 1000000000000000000n);
  console.log("txB", txB.hash);
}

try {
  console.log("Calling approveToken() function");
  approveToken();
} catch (error) {
  console.error("An error occurred:", error);
}
