//Script to approve the balancer vault to spend the erc20 tokens

import hre from "hardhat";
import { ethers } from "hardhat";
import approveToken from "./02approveToken";
import vaultABI from "./vaultABI";
import { BalancerSDK , Network} from "@balancer-labs/sdk";

async function approveVault() {
  const playerA = await hre.deployments.get("PlayerAToken");
  const playerB = await hre.deployments.get("PlayerBToken");

  const vaultMainnet = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
  //const vaultSepolia = "TBD";

  const approvalA = await approveToken(
    playerA.address,
    vaultMainnet,
    1000000000000000000n
  );
  //console.log("Approval A", approvalA);

  const approvalB = await approveToken(
    playerB.address,
    vaultMainnet,
    1000000000000000000n
  );
  //console.log("Approval B", approvalB);

  console.log("Done");

  const amountIn = [100000000000000000n, 100000000000000000n];

  const sender = await hre.getNamedAccounts();
  console.log("sender ===> ", sender);
  const signer = await ethers.getSigner(sender.deployer);

  const vault = new ethers.Contract(vaultMainnet, vaultABI, signer);

  const poolId =
    "0x70d374098c4793d6621934eaaa57c7eec7218df100010000000000000000068a";

    const tokensIn = [
        "0xf93b0549cD50c849D792f0eAE94A598fA77C7718", // A
        "0x8CeA85eC7f3D314c4d144e34F2206C8Ac0bbadA1", // B
      ];

      const balancerSdk = await BalancerSDK.create({
        network: http://127.0.0.1:8545/,
        provider: hre.ethers.provider,
        signer: signer,
      });

  const joinTx = await vault.joinPool(
    poolId,
    sender.deployer,
    sender.deployer,
    {
        tokensIn,
        amountIn,
        userData,
        false
    }
    
  );
  const receipt = await joinTx.wait();

  console.log("Join Pool Tx", receipt);
}

try {
  console.log("Approving vault to spend tokens");
  approveVault();
} catch (e) {
  console.log(e);
}
