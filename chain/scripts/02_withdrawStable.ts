//script to withdraw stable token from the pool. TODO transfer stable from controller to winners.

import hre from "hardhat";
import Contoller from "../artifacts/contracts/Controller.sol/Controller.json";
import DrawToken from "../artifacts/contracts/DrawToken.sol/DrawToken.json";
import stableToken from "../artifacts/contracts/Stable.sol/StableToken.json";
import { ethers } from "hardhat";
import { AddressLike, BigNumberish, EventLog } from "ethers";

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

  const [addresses, balance, totalBalance] = await controller.getPoolTokens();
  console.log("Pool Tokens Addresses: ", addresses);
  console.log("Pool Tokens Amounts: ", balance);
  console.log("Total Pool Tokens Amount: ", totalBalance);

  //Win token balance
  let [cash, managed, lastChangeBlock, assetManager] =
    await controller.getPoolTokenInfo(addresses[1]);
  console.log("Cash balance: ", cash);
  console.log("Managed balance: ", managed);
  console.log("Last Change Block: ", lastChangeBlock);
  console.log("Asset Manager: ", assetManager);

  const managedPoolControllerAddress = assetManager;
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
  console.log("Sender ===> ", sender.user1);
  const deployer = await ethers.getSigner(sender.deployer);
  console.log("deployer ===> ", deployer.address);
  const managedPoolContractSigner = new ethers.Contract(
    managedPoolControllerAddress,
    Contoller.abi,
    deployer
  );

  const ownerAddress = await managedPoolContractSigner.owner();

  console.log("Owner Address ==== >>>>", ownerAddress);

  const poolJoinExitDisable =
    await managedPoolContractSigner.setJoinExitEnabled(false);
  poolJoinExitDisable.wait();
  console.log("Join Exit Disabled", poolJoinExitDisable);
  const poolSwapState = await managedPoolContractSigner.setSwapEnabled(false);
  poolSwapState.wait();

  console.log("Withdraw from Pool ==> Check Stable", addresses[1]);
  console.log("Withdraw from Pool ==> Check Cash", cash);
  if (cash) {
    const withdrawTx = await managedPoolContractSigner.withdrawFromPool(
      addresses[1],
      cash
    );
    console.log("Withdraw Tx", withdrawTx);
  }
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
    20142999
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
  //convert winners to array of AddressLike
  const winnersAddressLike = winners.map((winner) => winner as AddressLike);
  console.log("Winners AddressLike", winnersAddressLike);

  const winnerBalance = await drawTokenContract.balanceOf(winners[0]);
  console.log("Winner Balance", winnerBalance);

  // //stable token balance
  // [cash, managed, lastChangeBlock, assetManager] =
  //   await controller.getPoolTokenInfo(addresses[1]);
  console.log("Cash balance: ", cash);
  // console.log("Managed balance: ", managed);
  // console.log("Last Change Block: ", lastChangeBlock);
  // console.log("Asset Manager: ", assetManager);

  const winnings = [10000000n, 10000000n, 10000000n];

  const stableTokenAddress = addresses[1];
  console.log("Stable Token Address", stableTokenAddress);
  const stableTokenContract = new ethers.Contract(
    stableTokenAddress,
    stableToken.abi,
    provider
  );
  let walletBalance = await stableTokenContract.balanceOf(winners[0]);
  console.log("Wallet Balance Before transfer", walletBalance);

  const winTransfer = await managedPoolContractSigner.batchTransfer(
    winnersAddressLike,
    winnings,
    addresses[1]
  );

  walletBalance = await stableTokenContract.balanceOf(winners[0]);

  console.log("Wallet Balance after transfer", walletBalance);
};

try {
  console.log("Calling function");
  func();
} catch (error) {
  console.error("An error occurred:", error);
}
