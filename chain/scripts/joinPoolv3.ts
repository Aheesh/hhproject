import * as dotenv from "dotenv";
dotenv.config();
import { BalancerSDK, Network } from "@balancer-labs/sdk";

async function join() {
  const balancer = new BalancerSDK({
    network: Network.SEPOLIA,
    //rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    rpcUrl: "http://127.0.0.1:8545/",
  });

  const signer = await balancer.provider.getSigner();
  console.log("Signer: ", signer);

  const poolId =
    "0x74e062790727a4cbda176b3ea72fa014df62408500010000000000000000068e";
  const pool = await balancer.pools.find(poolId);
  console.log("Pool Address: ", pool);
}

join();
