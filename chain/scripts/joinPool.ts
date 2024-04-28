//Script to LP EOA using joinPool

import {
  formatBytes32String,
  parseBytes32String,
} from "@ethersproject/strings";
import { AddressLike, BytesLike } from "ethers";
import hre, { ethers } from "hardhat";
import { Address } from "hardhat-deploy/types";

const func = async () => {
  //Get access to deployed Controlle contract
  const { deployments } = hre;
  //await deployments.fixture();
  const deployment = await deployments.get("Controller");
  console.log("Controller Address : ", deployment.address);
  const controller = await hre.ethers.getContractAt(
    "Controller",
    deployment.address
  );

  const tokenB = ethers.getAddress(
    "0x8cea85ec7f3d314c4d144e34f2206c8ac0bbada1"
  );
  const tokenA = ethers.getAddress(
    "0xf93b0549cd50c849d792f0eae94a598fa77c7718"
  );

  //construct an adddress array with tokenA and tokenB
  const tokenArray = [tokenA, tokenB];
  //create an array with amount of tokens to be deposited
  const amountIn = [1000000000000000000n, 1000000000000000000n];
  const { sender } = await hre.getNamedAccounts();
  console.log("sender address", sender);
  //const recipientAddress = sender[await hre.getNamedAccounts()] as AddressLike; //Same as sender
  //User data placeholder
  const data = Buffer.alloc(1);
  data[0] = 0;
  //InternalBalance
  let internalBalance = false;

  const poolId =
    "0xa178699567e122c4a75ac27cbaa4d84fa7c728e800010000000000000000068e";
  const poolID = formatBytes32String(poolId);

  const JoinPoolRequest = {
    assets: tokenArray,
    maxAmountIn: amountIn,
    userData: data,
    fromInternalBalance: internalBalance,
  };

  const tx = await controller.joinPool(
    poolId as BytesLike,
    sender as AddressLike,
    sender as AddressLike,
    JoinPoolRequest
  );
};
