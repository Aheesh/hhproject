import { BalancerSDK, Network, PoolType } from "@balancer-labs/sdk";
import hre from "hardhat";
import { ethers } from "hardhat";

const poolInit = async () => {
  console.log("Starting the pool init");
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

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

  const deployment = await deployments.get("Controller");
  console.log("Controller Address : ", deployment.address);
  const controller = await hre.ethers.getContractAt(
    "Controller",
    deployment.address
  );
  const controllerAddress = await controller.getAddress();
  console.log("Controller Address", controllerAddress);

  const poolId = await controller.getPoolId();
  console.log("Pool ID: ", poolId);

  //Init the pool and LP
  // Convert the poolId string to a BigInt
  const poolIdBigInt = BigInt(`0x${poolId.slice(2)}`);
  // Bitshift the poolId 64 bits to the right to get the pool address
  const poolAddressBigInt = poolIdBigInt >> 64n;
  // Convert the BigInt to a hex string with leading zeros
  const poolAddress = `0x${poolAddressBigInt.toString(16).padStart(40, "0")}`;

  console.log(`Pool Address: ${poolAddress}`);

  const balancer = new BalancerSDK({
    network: Network.MAINNET,
    rpcUrl: "http://127.0.0.1:8545", // Using local fork for simulation
  });
  const weightedPoolFactory = balancer.pools.poolFactory.of(PoolType.Weighted);

  // Build initial join of pool
  const initJoinParams = weightedPoolFactory.buildInitJoin({
    joiner: deployer,
    poolId,
    poolAddress,
    tokensIn: [deploymentA.address, deploymentB.address],
    amountsIn: ["500000000000000000", "500000000000000000"],
  });

  // Sending initial join transaction
  const deployerSigner = await ethers.getSigner(deployer);

  await deployerSigner.sendTransaction({
    to: initJoinParams.to,
    data: initJoinParams.data,
  });

  // Check that pool balances are as expected after join
  const tokens = await balancer.contracts.vault.getPoolTokens(poolId);
  console.log("Pool ID: " + poolId);
  console.log("Pool Tokens Addresses: " + tokens.tokens);
  console.log("Pool Tokens balances: " + tokens.balances);
};

export default poolInit;
poolInit.tags = ["PoolInit"];
