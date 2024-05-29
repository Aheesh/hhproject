import hre from "hardhat";
import { ethers } from "hardhat";
import Contoller from "../artifacts/contracts/Controller.sol/Controller.json";
import { AddressLike, BytesLike } from "ethers";

interface JoinPoolRequest {
  assets: (AddressLike | BytesLike)[];
  maxAmountsIn: bigint[];
  userData?: Buffer;
  fromInternalBalance?: boolean;
}

async function joinPoolController() {
  const managedPoolControllerAddress =
    // "0x09212359a9fee1c8e2778965d9e29a91e947e060";
    "0xdce23dfe27e8130362c3812e4bb4a4aec57d5a3e";

  ////////PROVIDER////////////////
  const provider = hre.ethers.provider;
  const managedPoolContract = new ethers.Contract(
    managedPoolControllerAddress,
    Contoller.abi,
    provider
  );
  const managedPoolId = await managedPoolContract.getPoolId();
  console.log("Managed Pool Id", managedPoolId);

  ///////SIGNER////////////////
  const sender = await hre.getNamedAccounts();
  const signer = await ethers.getSigner(sender.user1);
  console.log("Signer ===> ", sender.user1);
  const managedPoolContractSigner = new ethers.Contract(
    managedPoolControllerAddress,
    Contoller.abi,
    signer
  );

  const tokensIn = [
    "0xf93b0549cD50c849D792f0eAE94A598fA77C7718", // A
    "0x8CeA85eC7f3D314c4d144e34F2206C8Ac0bbadA1", // B
  ];

  const amountIn = [100000000000000000n, 100000000000000000n];
  console.log("Amount In", amountIn);

  let internalBalance = false;

  const data = Buffer.alloc(1);
  data[0] = 0;

  const joinPoolRequest: JoinPoolRequest = {
    assets: tokensIn,
    maxAmountsIn: amountIn,
    userData: data,
    fromInternalBalance: internalBalance,
  };

  const tx = await managedPoolContractSigner.joinPool(
    sender.user1,
    sender.user1,
    joinPoolRequest
  );

  console.log("Transaction Hash", tx.hash);
}

try {
  console.log("Calling Join Pool Controller ");
  joinPoolController();
} catch (err) {
  console.log(err);
}
