//Script to LP EOA using joinPool

import hre, { ethers } from "hardhat";

const func = async () => {
  //Get access to deployed Controlle contract
  const { deployments } = hre;
  //await deployments.fixture();
  const deployment = await deployments.get("Controller");
  console.log("Controller Address : ", deployment.address);
  const controller = await hre.ethers.getContractAt(
    "Controller",
    "0x968804665f2fd018c0bd04355a6f9c814708237a"
  );

  const tokenB = ethers.getAddress(
    "0x273c507D8E21cDE039491B14647Fe9278D88e91D"
  );
  const tokenA = ethers.getAddress(
    "0x04F75a27cE2FDC591C71a88f1EcaC7e5Ce44f5Fc"
  );

  //construct an adddress array with tokenA and tokenB
  const tokenArray = [tokenB, tokenA];
  //create an array with amount of tokens to be deposited
  const amountIn = [1000000000000000000n, 1000000000000000000n];
  const { deployer } = await hre.getNamedAccounts();
  console.log("sender address", deployer);
  //const recipientAddress = sender[await hre.getNamedAccounts()] as AddressLike; //Same as sender
  //User data placeholder

  const pooltx = await controller.initPool(tokenArray, amountIn);
  console.log("Pool TX", pooltx);
};

try {
  console.log("Starting joinPool");
  func();
} catch (error) {
  console.error(error);
}
