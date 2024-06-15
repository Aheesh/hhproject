//script to connect to the pool and get pool tokens using the Controller contract getPoolTokens()

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

  const [addresses, balance, totalBalance] = await controller.getPoolTokens();
  console.log("Pool Tokens Addresses: ", addresses);
  console.log("Pool Tokens Amounts: ", balance);
  console.log("Total Pool Tokens Amount: ", totalBalance);

  const [poolAddress, poolSpecialization] =
    await controller.getPoolSpecialization();
  console.log("Pool Address : ", poolAddress);
  console.log("Pool Specialization : ", poolSpecialization);

  const poolAuthorizer = await controller.getAuthorizer();
  console.log("poolAuthorizer", poolAuthorizer);

  const poolJoinExitEnabled = await controller.getJoinExitEnabled();
  console.log("Managed Pool Join Exit Enabled status", poolJoinExitEnabled);

  const managedPoolControllerAddress =
    "0x23f7184A0303C679487AD8e3dd1011A77dFFF648";
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
