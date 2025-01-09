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

  const [cash, managed, lastChangeBlock, assetManager] =
    await controller.getPoolTokenInfo(addresses[4]);
  console.log("Cash balance: ", cash);
  console.log("Managed balance: ", managed);
  console.log("Last Change Block: ", lastChangeBlock);
  console.log("Asset Manager: ", assetManager);

  const [poolAddress, poolSpecialization] =
    await controller.getPoolSpecialization();
  console.log("Pool Address : ", poolAddress);
  console.log("Pool Specialization : ", poolSpecialization);

  const poolJoinExitEnabled = await controller.getJoinExitEnabled();
  console.log("Managed Pool Join Exit Enabled status", poolJoinExitEnabled);

  const managedPoolControllerAddress =
    "0xe8a1616ADbE364DCd41866228AE193C65eC2F6cA";
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
  console.log("Sender ===> ", sender);
  const signer = await ethers.getSigner(sender.deployer);
  console.log("Signer ===> ", sender.deployer);
  const managedPoolContractSigner = new ethers.Contract(
    managedPoolControllerAddress,
    Contoller.abi,
    signer
  );
  const poolJoinExitDisable =
    await managedPoolContractSigner.setJoinExitEnabled(false);
  console.log("Join Disbaled", poolJoinExitDisable);

  const poolJoinExitEnabled2 = await controller.getJoinExitEnabled();
  console.log("Managed Pool Join Exit Enabled status", poolJoinExitEnabled2);

  let poolSwapStatus = await controller.getSwapEnabled();
  console.log("Swap Enabled status", poolSwapStatus);

  const poolSwapEnabled = await managedPoolContractSigner.setSwapEnabled(false);
   console.log("Swap Enabled status", poolSwapEnabled);

  poolSwapStatus = await controller.getSwapEnabled();
  console.log("Swap Enabled status", poolSwapStatus);
};

try {
  console.log("Calling function");
  func();
} catch (error) {
  console.error("An error occurred:", error);
}
