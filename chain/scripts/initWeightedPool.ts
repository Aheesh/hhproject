import * as dotenv from "dotenv";
dotenv.config();
import {
  BalancerSDK,
  BalancerSdkConfig,
  Network,
  PoolType,
} from "@balancer-labs/sdk";
import { ethers } from "ethers";

async function initializeWeightedPool() {
  // Configure Balancer SDK
  const config: BalancerSdkConfig = {
    network: Network.MAINNET,
    rpcUrl: process.env.RPC_URL || "http://127.0.0.1:8545",
  };
  const balancer = new BalancerSDK(config);

  // Setup provider and wallet
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY not found in .env");
  }
  const wallet = new ethers.Wallet(privateKey, provider);
  const signerAddress = await wallet.getAddress();
  console.log("Initializing pool with signer:", signerAddress);

  // Token addresses (replace with your actual token addresses)
  const PToken = "0xAE306F81E0075e0430217aaA88A081b43aaFE577";
  const tokenA = "0xF62eEc897fa5ef36a957702AA4a45B58fE8Fe312";
  const tokenB = "0x364C7188028348566E38D762f6095741c49f492B";
  const drawToken = "0x5147c5C1Cb5b5D3f56186C37a4bcFBb3Cd0bD5A7";
  const stableToken = "0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9";

  // Pool configuration
  const poolId = "0xae306f81e0075e0430217aaa88a081b43aafe5770001000000000000000006eb"; // Replace with your pool ID
  const poolAddress = "0xae306f81e0075e0430217aaa88a081b43aafe577"; // Replace with your pool address

  // Initialize pool factory
  const weightedPoolFactory = balancer.pools.poolFactory.of(PoolType.Weighted);

  // Define tokens and amounts
  const poolTokens = [PToken, tokenA, tokenB, drawToken, stableToken];
  const amountsIn = [
    "5192296858534827628530496329000000", // PToken
    "3000000000000000000", // Token A
    "1500000000000000000", // Token B
    "500000000000000000", // Draw Token
    "10000000000000000000", // Stable Token
  ];

  // Approve tokens
  const VAULT_ADDRESS = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"; // Balancer Vault
  
  console.log("Approving tokens...");
  for (let i = 0; i < poolTokens.length; i++) {
    const tokenContract = new ethers.Contract(
      poolTokens[i],
      ["function approve(address spender, uint256 amount) public returns (bool)"],
      wallet
    );

    try {
      const tx = await tokenContract.approve(
        VAULT_ADDRESS,
        amountsIn[i]
      );
      await tx.wait();
      console.log(`Approved ${poolTokens[i]}`);
    } catch (error) {
      console.error(`Failed to approve ${poolTokens[i]}:`, error);
      throw error;
    }
  }

  // Build and execute pool initialization
  try {
    console.log("Building init join parameters...");
    const initJoinParams = weightedPoolFactory.buildInitJoin({
      joiner: signerAddress,
      poolId,
      poolAddress,
      tokensIn: poolTokens,
      amountsIn,
    });

    console.log("Sending init join transaction...");
    const tx = await wallet.sendTransaction({
      to: initJoinParams.to,
      data: initJoinParams.data,
      gasLimit: BigInt(30000000),
    });

    await tx.wait();
    console.log("Pool initialized successfully!");

    // Verify pool balances
    const poolInfo = await balancer.contracts.vault.getPoolTokens(poolId);
    console.log("Final pool state:");
    console.log("Tokens:", poolInfo.tokens);
    console.log("Balances:", poolInfo.balances.map(b => b.toString()));

  } catch (error) {
    console.error("Failed to initialize pool:", error);
    throw error;
  }
}

// Execute the script
async function main() {
  try {
    await initializeWeightedPool();
  } catch (error) {
    console.error("Script failed:", error);
    process.exit(1);
  }
}

main(); 