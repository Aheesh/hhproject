//script to withdraw stable token from the pool. TODO transfer stable from controller to winners.

import hre from "hardhat";
import Contoller from "../artifacts/contracts/Controller.sol/Controller.json";
import DrawToken from "../artifacts/contracts/DrawToken.sol/DrawToken.json";
import { ethers } from "hardhat";
import { EventLog } from "ethers";

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
    await controller.getPoolTokenInfo(addresses[1]);
  console.log("Cash balance: ", cash);
  console.log("Managed balance: ", managed);
  console.log("Last Change Block: ", lastChangeBlock);
  console.log("Asset Manager: ", assetManager);

  const managedPoolControllerAddress =
    "0x41802bE24561e1308C3E33A6dcBF6596c28e5E1b";
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
    addresses[1],
    cash
  );
  console.log("Withdraw Tx", withdrawTx);

  const drawTokenAddress = addresses[4];
  console.log("Draw Token Address", drawTokenAddress);
  const drawTokenContract = new ethers.Contract(
    drawTokenAddress,
    DrawToken.abi,
    provider
  );

  const pastEvents = await drawTokenContract.queryFilter(
    "TokenTransfer",
    20142800,
    20142900
  );
  const winnersArray: string[] = [];
  pastEvents.forEach((event) => {
    const winnerAddress = (event as EventLog).args[0];
    console.log((event as EventLog).args[0]);
    winnersArray.push(winnerAddress);
  });

  //display unique values from winnersArray
  const winners = [...new Set(winnersArray)];
  console.log("Winners", winners);

  const winnerBalance = await drawTokenContract.balanceOf(winners[0]);
  console.log("Winner Balance", winnerBalance);
};

try {
  console.log("Calling function");
  func();
} catch (error) {
  console.error("An error occurred:", error);
}
