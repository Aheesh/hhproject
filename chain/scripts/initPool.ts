import dotenv from "dotenv";
dotenv.config();
import { BalancerSDK, Network } from "@balancer-labs/sdk";
import hre from "hardhat";

async function initPool() {
  const balancerSdk = new BalancerSDK({
    network: Network.MAINNET,
    rpcUrl: "http://127.0.0.1:8545",
  });

  const { provider } = balancerSdk;
  const signer = provider.getSigner();
  const address = await signer.getAddress();
  console.log("Signer Address", address);
}

try {
  console.log("Initializing Pool");
  initPool();
} catch (err) {
  console.log(err);
}
