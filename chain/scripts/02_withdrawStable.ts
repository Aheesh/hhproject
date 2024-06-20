//script to withdraw stable token from the pool. TODO transfer stable from controller to winners.

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

  const managedPoolControllerAddress =
    "0x516863C9f880e450Ccd2f688b57285c14C3B1374";
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

  const withdrawTx = await managedPoolContractSigner.withdrawFromPool(
    addresses[4],
    cash
  );
  console.log("Withdraw Tx", withdrawTx);
};

try {
  console.log("Calling function");
  func();
} catch (error) {
  console.error("An error occurred:", error);
}
