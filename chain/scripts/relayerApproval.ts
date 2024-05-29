//Script to approve controller to spend tokens for EOA and join pool

import hre, { ethers } from "hardhat";
import Contoller from "../artifacts/contracts/Controller.sol/Controller.json";

async function relayerApproval() {
  const deployments = await hre.deployments;
  const deployment = await deployments.get("PlayerAToken");
  console.log("PlayerA Token Address : ", deployment.address);
  const controller = await ethers.getContractAt(
    "PlayerAToken",
    deployment.address
  );

  const approvalAmount = 100000000000000000n;
  const controllerAddress = "0xdce23dfe27e8130362c3812e4bb4a4aec57d5a3e";
  console.log(
    "Approving Controller to spend token A for address",
    controllerAddress
  );
  const approval = await controller.approve(controllerAddress, approvalAmount);
  console.log("Approval", approval);

  const deploymentB = await deployments.get("PlayerBToken");
  console.log("PlayerB Token Address : ", deploymentB.address);
  const controllerB = await ethers.getContractAt(
    "PlayerBToken",
    deploymentB.address
  );

  console.log(
    "Approving Controller to spend token B for address",
    controllerAddress
  );
  const approvalB = await controllerB.approve(
    controllerAddress,
    approvalAmount
  );
  console.log("Approval", approvalB);

  const managedPoolControllerAddress =
    "0xfe9df063231c3b909da9baa0e6279d4576c1c792";

  ///////SIGNER////////////////
  const sender = await hre.getNamedAccounts();
  const signer = await ethers.getSigner(sender.user1);
  console.log("Signer ===> ", sender.user1);
  const managedPoolContractSigner = new ethers.Contract(
    managedPoolControllerAddress,
    Contoller.abi,
    signer
  );
  console.log("managedPoolContractSigner ===> ", managedPoolContractSigner);
  console.log("managedPoolControllerAddress ===> ");
  const relayApprovalTx = await managedPoolContractSigner.setRelayerApproval(
    true
  );
  console.log("Relay Approval Tx ===> ", relayApprovalTx);
  const relayApprovalTxReceipt = await relayApprovalTx.wait();
  console.log("Relay Approval Tx Receipt ===> ", relayApprovalTxReceipt);
}

try {
  console.log("Relayer Approval check");
  relayerApproval();
} catch (error) {
  console.log(error);
}
