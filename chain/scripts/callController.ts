//Script to call the deployed controller of a managed pool

import hre from "hardhat";
import { ethers } from "hardhat";
import controller from "../artifacts/contracts/Controller.sol/Controller.json";
import { ContractRunner } from "ethers";

const func = async () => {
  const deployedAddress = "0x542cf32b7fd8567aa2f94fe366c406c7f80d233f";

  const sender = await hre.getNamedAccounts();
  //console.log("sender ===> ", sender);
  const signer = await ethers.getSigner(sender.deployer);
  //console.log("Signer ===> ", signer);

  //console.log("Deployed Controller ABI ", controller.abi);

  const deployedController = new ethers.Contract(
    deployedAddress,
    controller.abi,
    signer
  );

  const poolTokens = await deployedController.getPoolId();
  console.log("Pool Id", poolTokens);

  let poolStatus = await deployedController.getJoinExitEnabled();
  console.log("Pool Status", poolStatus);

  const poolDisable = await deployedController.setJoinExitEnabled(true);
  console.log("Pool Disabled", poolDisable);

  poolStatus = await deployedController.getJoinExitEnabled();
  console.log("Pool Status", poolStatus);
};

try {
  console.log("Calling Controller check");
  func();
} catch (error) {
  console.error("An error occurred:", error);
}
