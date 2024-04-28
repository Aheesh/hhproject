import { formatBytes32String } from "@ethersproject/strings";
import { AddressLike, BytesLike } from "ethers";
import { ethers } from "hardhat";
import hre from "hardhat";

interface JoinPoolRequest {
  assets: (AddressLike | BytesLike)[];
  maxAmountsIn: bigint[];
  userData?: Buffer;
  fromInternalBalance?: boolean;
}

async function joinLiquidityPool() {
  const deployments = await hre.deployments;
  const deployment = await deployments.get("Controller");
  console.log("Controller Address : ", deployment.address);
  const controller = await ethers.getContractAt(
    "Controller",
    deployment.address
  );

  const tokenA = "0xf93b0549cd50c849d792f0eae94a598fa77c7718";
  const tokenB = "0x8cea85ec7f3d314c4d144e34f2206c8ac0bbada1";

  const tokenArray: (AddressLike | BytesLike)[] = [
    ethers.getAddress(tokenA),
    ethers.getAddress(tokenB),
  ];

  const amountIn: bigint[] = [1000000000000000000n, 1000000000000000000n];
  console.log("Amount In", amountIn);
  const sender = await hre.getNamedAccounts();
  console.log("sender address", sender.deployer);

  let internalBalance = false;

  const poolId =
    "0xe5957ff84ebd6f66dd782811a7968d7e08cd013f00010000000000000000068f"; // Your pool ID goes here
  console.log("Pool Id", poolId);

  const data = Buffer.alloc(1);
  data[0] = 0;

  const joinPoolRequest: JoinPoolRequest = {
    assets: tokenArray,
    maxAmountsIn: amountIn,
    userData: data,
    fromInternalBalance: internalBalance,
  };

  try {
    const tx = await controller.joinPool(
      poolId as BytesLike,
      sender.deployer as AddressLike,
      sender.deployer as AddressLike,
      joinPoolRequest
    );
    console.log("Transaction sent:", tx);
  } catch (error) {
    console.error("Error joining pool:", error);
  }
}

try {
  console.log("Calling joinLiquidityPool() function");
  joinLiquidityPool();
} catch (error) {
  console.error("An error occurred:", error);
}
