import { BalancerSDK } from "@balancer-labs/sdk";

async function joinPool() {
  const balancer = new BalancerSDK({
    network: 1, // mainnet
    rpcUrl: "https://rpc.ankr.com/eth",
  });

  const signer = balancer.provider.getSigner();

  const poolId =
    "0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080";
  const pool = balancer.pools.find(poolId);
  console.log("Pool:", pool);
}

try {
  console.log("Calling joinPool() function");
  joinPool();
} catch (error) {
  console.error("An error occurred:", error);
}
