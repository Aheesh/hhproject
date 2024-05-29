//Script to approve address to spend token

import hre from "hardhat";
import { ethers } from "hardhat";
import { Address } from "hardhat-deploy/types";
import tokenAcontract from "../artifacts/contracts/PlayerAToken.sol/PlayerAToken.json";

async function approveToken(
  tokenAddress: Address,
  spenderAddress: Address,
  approvalAmount: bigint
) {
  const sender = await hre.getNamedAccounts();
  // console.log("sender ===> ", sender);
  const signer = await ethers.getSigner(sender.deployer);
  //console.log("Signer ===> ", signer);
  const deployedToken = new ethers.Contract(
    tokenAddress,
    tokenAcontract.abi,
    signer
  );

  console.log("Approving spend token for address", spenderAddress);
  const approval = await deployedToken.approve(spenderAddress, approvalAmount);
  //console.log("Approval", approval);
}

export default approveToken;
