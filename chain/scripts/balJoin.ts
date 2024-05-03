import * as dotenv from "dotenv";
dotenv.config();
import { BalancerSDK, Network } from "@balancer-labs/sdk";
import hre from "hardhat";
import { ethers } from "hardhat";

const func = async () => {
  const providerApiKey = process.env.ALCHEMY_API_KEY;

  const balancer = new BalancerSDK({
    network: 11155111, // Sepolia
    rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`,
  });

  const sender = await hre.getNamedAccounts();
  console.log("sender ===> ", sender);
  const signer = await ethers.getSigner(sender.deployer);
  console.log("Signer ===> ", signer);

  const poolId =
    "0xC745F3D588545C5F18389DD0CB5218862B1DF7F60001000000000000000000D7";

  const pool = await balancer.pools.find(poolId);
  console.log("Pool", pool);

  if (!pool) throw new Error("Pool not found");

  const vault = balancer.contracts.vault;
  console.log("Vault", vault);

  //   const tokenA = "0xaB9b817a7f4bBf2ca729a0f5eAb6249165faa647";
  //   const tokenB = "0x59e074DcA17bd9619a2b97464b2F2400D1aB7646";

  //   const tokenArray: (AddressLike | BytesLike)[] = [
  //     ethers.getAddress(tokenB),
  //     ethers.getAddress(tokenA),
  //   ];

  // Tokens that will be provided to pool by joiner
  const tokensIn = [
    "0xaB9b817a7f4bBf2ca729a0f5eAb6249165faa647", // A
    "0x59e074DcA17bd9619a2b97464b2F2400D1aB7646", // B
  ];

  const amountIn = ["100000000000000000", "100000000000000000"];
  console.log("Amount In", amountIn);

  const address = await signer.getAddress();

  const slippage = "0";
  const { to, data, minBPTOut } = pool.buildJoin(
    address,
    tokensIn,
    amountIn,
    slippage
  );

  console.log("To", to);
  console.log("Data", data);
  console.log("MinBPTOut", minBPTOut);
  console.log("Gas", await signer.estimateGas({ to, data }));

  //Calculate priceImpact
  const priceIpact = await pool.calcPriceImpact(amountIn, minBPTOut, true);
  console.log("Price Impact", priceIpact);

  //Submit join tx
  const tx = await signer.sendTransaction({ to, data });
  console.log("Transaction sent to join pool:", tx);

  await tx.wait();
};

try {
  console.log("Calling balJoin script");
  func();
} catch (error) {
  console.error("An error occurred:", error);
}
