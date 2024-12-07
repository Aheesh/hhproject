//ts-node script to initialize a weighted pool with 4 tokens (TokenA, TokenB, DrawToken, StableToken) 
import * as dotenv from "dotenv";
dotenv.config();
import {
  BalancerSDK,
  BalancerSdkConfig,
  Network,
  PoolType,
} from "@balancer-labs/sdk";
import { ethers } from "ethers";
import { ethers as hreEthers } from 'hardhat';

async function poolInit() {
  // establish link to the BalancerSDK
  const config: BalancerSdkConfig = {
    network: Network.MAINNET,
    rpcUrl: "http://127.0.0.1:8545",
  }; // Using local fork for simulation
  const balancerSDK = new BalancerSDK(config);

  // create a new provider
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

  // get the signer account
  const pvtKey = process.env.ACCOUNT1_KEY;
  if (!pvtKey) {
    throw new Error("ACCOUNT1_KEY is not set");
  }
  let wallet = new ethers.Wallet(pvtKey);

  // connect the wallet to the provider
  wallet = wallet.connect(provider);

  // get the address of the signer
  const signerAddress = await wallet.getAddress();
  console.log("Signer address:", signerAddress);

  // INIT weighted pool
  const tokenA = "0xF62eEc897fa5ef36a957702AA4a45B58fE8Fe312";
  const tokenB = "0x364C7188028348566E38D762f6095741c49f492B";

  const poolId =
    "0xae306f81e0075e0430217aaa88a081b43aafe5770001000000000000000006eb";
  const poolAddress = "0xae306f81e0075e0430217aaa88a081b43aafe577";
  const PToken = "0xAE306F81E0075e0430217aaA88A081b43aaFE577";
  const DrawToken = "0x5147c5C1Cb5b5D3f56186C37a4bcFBb3Cd0bD5A7";
  const StableToken = "0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9";

  const weightedPoolFactory = balancerSDK.pools.poolFactory.of(
    PoolType.Weighted
  );

  //Approve BPT and pool tokens to be transferred by vault.
  const poolTokens = [PToken, tokenB, DrawToken, StableToken, tokenA];
  const amountsIn = [
    "5192296858534827628530496329000000",
    "3000000000000000000",
    "1000000000000000000",
    "10000000000000000000",
    "6000000000000000000",
  ];
  for (let i = 0; i < poolTokens.length; i++) {
    const token = poolTokens[i];
    const amountIn = amountsIn[i];
    const tokenContract = new ethers.Contract(
      token,
      [
        "function approve(address spender, uint256 amount) public returns (bool)",
      ],
      wallet
    );
    await tokenContract.approve(
      "0xba12222222228d8ba445958a75a0704d566bf2c8",
      amountIn
    );
  }

  // Build Init and Join the pool.
  const initJoinParams = weightedPoolFactory.buildInitJoin({
    joiner: signerAddress,
    poolId,
    poolAddress,
    tokensIn: poolTokens,
    amountsIn: amountsIn,
  });

  console.log("poolTokens Length:", poolTokens.length);
  console.log("AmountsIn Length:", amountsIn.length);

  //Sending the initial join transaction
  await wallet.sendTransaction({
    to: initJoinParams.to,
    data: initJoinParams.data,
    gasLimit: 30000000,
  });

  // Check the pool balances.
  const tokens = await balancerSDK.contracts.vault.getPoolTokens(poolId);
  console.log("Pool Id:", poolId);
  console.log("Pool tokens:", tokens.tokens);
  console.log("Pool balances:", tokens.balances);

  // Call the functions
}

try {
  poolInit();
} catch (err) {
  console.log(err);
}
// Path: examples/pools/create/05_poolInit.ts