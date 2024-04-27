//script to connect to the pool and get pool tokens using the Controller contract getPoolTokens()

import hre from "hardhat";
import { ethers } from "ethers";

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
  const poolTokens = await controller.getPoolTokens();
  console.log("Pool Tokens: ", poolTokens);
};
try {
  console.log("Calling function");
  func();
} catch (error) {
  console.error("An error occurred:", error);
}
