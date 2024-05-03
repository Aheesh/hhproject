//Script to join as LP on the managed pool

import hre from "hardhat";
import { ethers } from "hardhat";
import { AddressLike, BytesLike } from "ethers";
import controller from "../artifacts/contracts/Controller.sol/Controller.json";

interface JoinPoolRequest {
  assets: (AddressLike | BytesLike)[];
  maxAmountsIn: bigint[];
  userData?: Buffer;
  fromInternalBalance?: boolean;
}

const func = async () => {
  const { user1 } = await hre.getNamedAccounts();
  console.log("sender ===> ", user1);
  const signer = await ethers.getSigner(user1);
  console.log("Signer ===> ", signer);

  //const poolControllerAddress = "0x9CBd52f4186024f92D2c3Fc59E133090F40758f6";
  const poolControllerAddress = "0x1e4a94b443a24c9f40b9f0d48132e2aef5cf701f"; //localhost

  const deployedController = new ethers.Contract(
    poolControllerAddress,
    controller.abi,
    signer
  );

  let poolStatus = await deployedController.getJoinExitEnabled();
  console.log("Pool LP Join Exit Status", poolStatus);

  const tokenA = "0xaB9b817a7f4bBf2ca729a0f5eAb6249165faa647";
  const tokenB = "0x59e074DcA17bd9619a2b97464b2F2400D1aB7646";

  const tokenArray: (AddressLike | BytesLike)[] = [
    ethers.getAddress(tokenB),
    ethers.getAddress(tokenA),
  ];

  const amountIn: bigint[] = [100000000000000000n, 100000000000000000n];
  console.log("Amount In", amountIn);

  let internalBalance = false;

  const data = Buffer.alloc(1);
  data[0] = 0;

  const joinPoolRequest: JoinPoolRequest = {
    assets: tokenArray,
    maxAmountsIn: amountIn,
    userData: data,
    fromInternalBalance: internalBalance,
  };

  try {
    console.log("Transaction send to join pool ====>>>>:", joinPoolRequest);
    console.log("Controller Address : ", poolControllerAddress);
    console.log("Deployed Controller", deployedController);
    const poolStatus = await deployedController.getJoinExitEnabled();
    console.log("Pool LP Join Exit Status", poolStatus);
    //console.log(Object.keys(deployedController));
    const tx = await deployedController.joinPool(
      signer,
      signer,
      joinPoolRequest
    );
    console.log("Transaction sent to join pool:", tx);
  } catch (error) {
    console.error("Error joining pool:", error);
  }
};

try {
  console.log("Calling JOIN Pool Script");
  func();
} catch (e) {
  console.error("An error occurred:", e);
}
