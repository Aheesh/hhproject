//Deploy ControllerFactory contract

import { ContractReceipt } from "@ethersproject/contracts";
import { utils } from "ethers";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ControllerFactory } from "../typechain-types/contracts/ControllerFactory";
import controllerFactoryABI from "../artifacts/contracts/ControllerFactory.sol/ControllerFactory.json";
import { ethers } from "hardhat";
import tokenDrawABI from "../artifacts/contracts/DrawToken.sol/DrawToken.json";
import controllerABI from "../artifacts/contracts/Controller.sol/Controller.json";

const vaultAddress = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
const managedPoolAddressMainnet = "0xBF904F9F340745B4f0c4702c7B6Ab1e808eA6b93";
//const managedPoolAddressSepolia = "0x63e179C5b6d54B2c2e36b9cE4085EF5A8C86D50c";
//const managedPoolAddressBase = "0x9a62C91626d39D0216b3959112f9D4678E20134d";
const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  await deploy("ControllerFactory", {
    from: deployer,
    args: [vaultAddress, managedPoolAddressMainnet],
    log: true,
    autoMine: true,
  });

  console.log("Deployer Address: ", deployer);
  const deploymentA = await hre.deployments.get("PlayerAToken");
  console.log(
    "deployed contract address 🤾🏻‍♂️ Token A 🤾🏻‍♂️ ===",
    deploymentA.address
  );

  const deploymentB = await hre.deployments.get("PlayerBToken");
  console.log(
    "deployed contract address 🤽🏻‍♀️ Token B 🤽🏻‍♀️===",
    deploymentB.address
  );

  const deploymentDrawToken = await hre.deployments.get("DrawToken");
  console.log(
    "deployed contract address DrawToken ✍️ ✍️ ✍️ === ✍️ ✍️ ✍️",
    deploymentDrawToken.address
  );

  const deploymentStableToken = await hre.deployments.get("StableToken");
  console.log(
    "deployed contract address StableToken 🐎 ⚖️ 🐎 === 🐎 ⚖️ 🐎",
    deploymentStableToken.address
  );

  //USDC address on Sepolia
  console.log("Network name", hre.network.name);
  // let deploymentStableToken = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; //USDC address on Mainnet
  // if (hre.network.name === "sepolia") {
  //   deploymentStableToken = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
  // } else if (hre.network.name === "base") {
  //   deploymentStableToken = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed"; //DEGEN address on Base
  // }
  console.log("Stable token address", deploymentStableToken);

  const deployment = await hre.deployments.get("ControllerFactory");
  console.log(
    "deployed contract address 🏭 Controller Factory 🏭 === 🏭",
    deployment.address
  );
  //check if controller contract was deployed successfully

  ////////////////////////////Controller Pool Deployment////////////////////////

  // Create array of token objects with addresses and their corresponding weights
  const tokenConfig = [
    { address: deploymentA.address, weight: "140000000000000000" }, // A: 0.14
    { address: deploymentB.address, weight: "180000000000000000" }, // B: 0.18
    { address: deploymentDrawToken.address, weight: "180000000000000000" }, // Draw: 0.18
    { address: deploymentStableToken.address, weight: "500000000000000000" }, // Stable: 0.50
  ];

  // Sort tokens by address (numerically)
  const sortedTokens = tokenConfig.sort((a, b) => 
    BigInt(a.address) < BigInt(b.address) ? -1 : 1
  );

  const minimalParams: ControllerFactory.MinimalPoolParamsStruct = {
    name: "GameToken",
    symbol: "GT",
    tokens: sortedTokens.map(t => t.address),
    normalizedWeights: sortedTokens.map(t => t.weight),
    swapFeePercentage: "10000000000000000",
    swapEnabledOnStart: true,
    managementAumFeePercentage: "10000000000000000",
    aumFeeId: 0,
  };
  /* call the instance on ContractFactory.create() function to create a new instance of the contract
  using the PlayerAToken and PlayerBToken addresses and 50:50 weight. Check for 
  ControllerCreated event  and get the poolId from the event args */
  const ContollerFactoryContract = await ethers.getContractAt(
    "ControllerFactory",
    deployment.address
  );
  console.log(
    "04 deploy script *******ControllerFactory *******",
    await ContollerFactoryContract.isDisabled()
  );

  const tx = await ContollerFactoryContract.create(minimalParams);
  const receipt = await tx.wait();

  console.log("05 deploy script -- receipt tx hash", tx.hash);
  ////////////////////////////////////////////////////////////////////////////

  //fetch poolId
  console.log(
    "🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 START - parsing logs 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 "
  );

  const iface = new utils.Interface(controllerFactoryABI.abi);
  // Parse the logs for ControllerCreated event
  const events = receipt.logs.map((log: { topics: string[], data: string }) => {
    const parsedLog = iface.parseLog(log);
    return parsedLog;
  });
  const poolId = events.find((event: { name?: string, args?: any }) => event?.name === "ControllerCreated")
    ?.args.poolId;

  const controllerAddress = events.find(
    (event: { name?: string, args?: any }) => event?.name === "ControllerCreated"
  )?.args.controller;
  console.log("PoolId 🏊 🏊 🏊 ===>>>>> 🏊 🏊 🏊", poolId);
  console.log(
    "Managed pool 🕹️ 🕹️ 🕹️ Controller Address 🕹️ 🕹️ 🕹️ ",
    controllerAddress
  );

  console.log(
    "🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 END of parsing logs 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 🪵 "
  );

  //deploy controller
  const deploymentController = await deploy("Controller", {
    from: deployer,
    args: [vaultAddress, poolId],
    log: true,
    autoMine: true,
  });

  console.log(
    "deployed contract address 🏭 Controller 🏭 === 🏭",
    deploymentController.address
  );

  //Set the controller address for Draw Token
  const drawTokenContract = await ethers.getContractAt(
    "DrawToken",
    deploymentDrawToken.address
  );

  const controllerTx = await drawTokenContract.setController(controllerAddress);
  controllerTx.wait();
  console.log("Controller value set", controllerTx.hash);

  //Set the controller address for PlayerAToken
  const playerATokenContract = await ethers.getContractAt(
    "PlayerAToken",
    deploymentA.address
  );

  const controllerTxPlayerA = await playerATokenContract.setController(
    controllerAddress
  );
  controllerTxPlayerA.wait();
  console.log("Controller value set", controllerTxPlayerA.hash);

  //Set the controller address for PlayerBToken
  const playerBTokenContract = await ethers.getContractAt(
    "PlayerBToken",
    deploymentB.address
  );

  const controllerTxPlayerB = await playerBTokenContract.setController(
    controllerAddress
  );
  controllerTxPlayerB.wait();
  console.log("Controller value set", controllerTxPlayerB.hash);

  //check managed pool controller owner address
  const managedPoolControllerContract = await ethers.getContractAt(
    "Controller",
    controllerAddress
  );

  const managedPoolControllerContractOwner =
    await managedPoolControllerContract.owner();
  console.log(
    "Managed Pool Controller Owner Address",
    managedPoolControllerContractOwner
  );
};

export default func;
func.tags = ["ControllerFactory", "Controller"];
