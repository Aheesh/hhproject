import { ethers } from "hardhat";
import { PlayerAToken } from "../typechain-types";

async function main() {
  const TOKEN_ADDRESS = "0x3abBB0D6ad848d64c8956edC9Bf6f18aC22E1485";
  const VAULT_ADDRESS = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
  
  const PlayerATokenFactory = await ethers.getContractFactory("PlayerAToken");
  const playerAToken = PlayerATokenFactory.attach(
    TOKEN_ADDRESS
  ) as PlayerAToken;

  // Get Transfer events from vault
  const transferFilter = playerAToken.filters.Transfer(VAULT_ADDRESS);
  const transferEvents = await playerAToken.queryFilter(transferFilter);

  console.log("\n=== Transfers from Balancer Vault ===");
  console.log("Total transfers found:", transferEvents.length);
  
  transferEvents.forEach((event, index) => {
    console.log(`\nTransfer #${index + 1}:`);
    console.log(`To: ${event.args.to}`);
    console.log(`Amount: ${ethers.formatEther(event.args.value)} tokens`);
    console.log(`Transaction Hash: ${event.transactionHash}`);
    console.log(`Block Number: ${event.blockNumber}`);
  });

  // Calculate total amount transferred from vault
  const totalTransferred = transferEvents.reduce((acc, event) => 
    acc + Number(ethers.formatEther(event.args.value)), 0
  );
  console.log(`\nTotal amount transferred from vault: ${totalTransferred} tokens`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 