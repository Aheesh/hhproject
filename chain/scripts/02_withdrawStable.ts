//script to withdraw stable token from the pool. TODO transfer stable from controller to winners.

import hre from "hardhat";
import Contoller from "../artifacts/contracts/Controller.sol/Controller.json";
import playerAToken from "../artifacts/contracts/PlayerAToken.sol/PlayerAToken.json";
import stableToken from "../scripts/abi/tokenStable.json"; //USDC proxy contract
import { ethers } from "hardhat";
import { AddressLike, EventLog } from "ethers";

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
  const [cash, managed, lastChangeBlock, assetManager] =
    await controller.getPoolTokenInfo(addresses[1]);
  console.log("Cash balance: ", cash);
  console.log("Managed balance: ", managed);
  console.log("Last Change Block: ", lastChangeBlock);
  console.log("Asset Manager: ", assetManager);

  //const managedPoolControllerAddress = assetManager;
  console.log("Managed Pool Controller Address", assetManager);
  const provider = hre.ethers.provider;
  // const managedPoolContract = new ethers.Contract(
  //   managedPoolControllerAddress,
  //   Contoller.abi,
  //   provider
  // );
  // const managedPoolId = await managedPoolContract.getPoolId();
  // console.log("Managed Pool Id", managedPoolId);

  const sender = await hre.getNamedAccounts();
  console.log("Sender ===> ", sender.user1);
  const deployer = await ethers.getSigner(sender.deployer);
  console.log("deployer ===> ", deployer.address);
  const managedPoolContractSigner = new ethers.Contract(
    assetManager,
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

  //Check address of holders of game winning outcome token
  const winTokenAddress = addresses[1];
  console.log("Game winning Token Address", winTokenAddress);
  const winTokenContract = new ethers.Contract(
    winTokenAddress,
    playerAToken.abi, //Check the ABI for the winning outcome token - TODO refactor to use the correct ABI
    provider
  );

  //Parse events for all token transfers
  provider.getBlockNumber().then((latestBlockNumber) => {
    console.log(`The latest block number is ${latestBlockNumber}`);
  });

  const blockheight = await provider.getBlockNumber();
  console.log("Block Height", blockheight);

  const pastEvents = await winTokenContract.queryFilter(
    "Transfer", //TODO refactor to use the game token events and not erc20 OZ transfer event
    lastChangeBlock,
    blockheight //latest block height
  );
  console.log("Past Events", pastEvents);
  const winnersArray: string[] = [];
  pastEvents.forEach((event) => {
    const winnerAddress = (event as EventLog).args[1]; //TODO args 0 for TransferToken event , erc20 Transfer event args 1
    console.log((event as EventLog).args[1]);
    winnersArray.push(winnerAddress);
  });

  //display unique values from winnersArray
  const winners = [...new Set(winnersArray)];
  console.log("Winners", winners);
  //convert winners to array of AddressLike
  const winnersAddressLike = winners.map((winner) => winner as AddressLike);
  console.log("Winners AddressLike", winnersAddressLike);

  const winnerBalance = await winTokenContract.balanceOf(winners[0]); //TODO refactor to get balance of all winners
  console.log("Winner Balance", winnerBalance);

  //stable token balance
  const [
    stableCash,
    stableManagedBalance,
    stableLastChangeBlock,
    stableAssetManager,
  ] = await controller.getPoolTokenInfo(addresses[2]);
  console.log("Cash balance: ", stableCash);
  console.log("Managed balance: ", stableManagedBalance);
  console.log("Last Change Block: ", stableLastChangeBlock);
  console.log("Asset Manager: ", stableAssetManager);

  const winnings = 102000000n; //[stableCash];
  //declare an array and store winnings in the array
  const winningsArray = [];
  winningsArray.push(winnings);

  const stableTokenAddress = addresses[2];
  console.log("Stable Token Address", stableTokenAddress);
  const stableTokenContract = new ethers.Contract(
    stableTokenAddress,
    stableToken.abi,
    provider
  );

  //Withdraw stable token from pool to managed pool controller
  console.log("Withdraw from Pool ==> Check Stable", addresses[2]);
  console.log("Withdraw from Pool ==> Check Cash", cash);
  if (cash) {
    const withdrawTx = await managedPoolContractSigner.withdrawFromPool(
      addresses[2],
      stableCash
    );
    console.log("Withdraw Tx", withdrawTx);
  }
  let walletBalance = await stableTokenContract.balanceOf(winners[0]);
  console.log("Wallet Balance Before transfer", walletBalance);

  const winTransfer = await managedPoolContractSigner.batchTransfer(
    winnersAddressLike,
    winningsArray,
    addresses[2]
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
