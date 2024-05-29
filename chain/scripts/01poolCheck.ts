//script to connect to the pool and get pool tokens using the Controller contract getPoolTokens()

import hre from "hardhat";
//import IManagedPool from "../artifacts/@balancer-labs/v2-interfaces/contracts/pool-utils/IManagedPool.sol/IManagedPool.json";
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
  const controllerAddress = await controller.getAddress();
  console.log("Controller Address", controllerAddress);

  const [addresses, balance, totalBalance] = await controller.getPoolTokens();
  console.log("Pool Tokens Addresses: ", addresses);
  console.log("Pool Tokens Amounts: ", balance);
  console.log("Total Pool Tokens Amount: ", totalBalance);

  const [poolAddress, poolSpecialization] =
    await controller.getPoolSpecialization();
  console.log("Pool Address and Specialization", poolAddress);
  console.log("Pool Specialization", poolSpecialization);

  const poolAuthorizer = await controller.getAuthorizer();
  console.log("poolAuthorizer", poolAuthorizer);

  const poolJoinExitEnabled = await controller.getJoinExitEnabled();
  console.log("Managed Pool Join Exit Enabled status", poolJoinExitEnabled);

  const managedPoolControllerAddress =
    // "0x09212359a9fee1c8e2778965d9e29a91e947e060";
    "0x2bd93245592f7676660402912b74032851e168e0";
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
  console.log("Join Disbaled", poolJoinExitDisable);

  const poolJoinExitEnabled2 = await controller.getJoinExitEnabled();
  console.log("Managed Pool Join Exit Enabled status", poolJoinExitEnabled2);

  const poolSwapEnabled = await controller.getSwapEnabled();
  console.log("Swap Enabled status", poolSwapEnabled);
};

try {
  console.log("Calling function");
  func();
} catch (error) {
  console.error("An error occurred:", error);
}
