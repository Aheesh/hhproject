//Script to call the deployed controller of a managed pool

import hre from "hardhat";
import { ethers } from "hardhat";
import controller from "../artifacts/contracts/Controller.sol/Controller.json";

const func = async () => {
  const deployedAddress = "0x5981c3d9e09fac286beaff7d29f6547b7e4b512e";
  //const deployedAddress = "0x9CBd52f4186024f92D2c3Fc59E133090F40758f6"; //

  const sender = await hre.getNamedAccounts();
  console.log("sender ===> ", sender);
  const signer = await ethers.getSigner(sender.deployer);
  console.log("Signer ===> ", signer);

  console.log("Deployed Controller ABI ", controller.abi);

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

  const poolAuthorizer = await deployedController.getAuthorizer();
  console.log("Pool Authorizer", poolAuthorizer);
};

try {
  console.log("Calling Controller check");
  func();
} catch (error) {
  console.error("An error occurred:", error);
}
