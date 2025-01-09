//Script to calculate the distribution of stable tokens to winners set the .env variable MODE to payoutCheck or payoutTransfer
//TODO the transfer is not working as expected, need to fix it. The amount is not being transferred to the winners from the owner's wallet instead of the controller's wallet

import { ethers } from "hardhat";
import { PlayerAToken, ERC20, Controller } from "../typechain-types";
import { formatEther, parseEther } from "ethers";

const POOL_ID = "0xa04263c06c9a4bc4655a2caf251ee5b424c868b60001000000000000000001b0";
const VAULT_ADDRESS = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
const INITIAL_LP_AMOUNT = parseEther("1000"); // 1000e18
const TOKEN_ADDRESS = "0x3abBB0D6ad848d64c8956edC9Bf6f18aC22E1485";
const CONTROLLER_ADDRESS = "0xe8a1616ADbE364DCd41866228AE193C65eC2F6cA";

const mode = process.env.MODE || 'payoutCheck';

if (!['payoutCheck', 'payoutTransfer'].includes(mode)) {
  throw new Error('Invalid mode. Use MODE=payoutCheck or MODE=payoutTransfer');
}

async function main() {
  const vault = await ethers.getContractAt("IVault", VAULT_ADDRESS);
  const controller = await ethers.getContractAt("Controller", CONTROLLER_ADDRESS);
  
  // Get pool tokens and balances
  const [tokens, balances] = await vault.getPoolTokens(POOL_ID);
  const stableTokenAddress = tokens[2];
  const stableToken = await ethers.getContractAt("ERC20", stableTokenAddress);
  const stableTokenSymbol = await stableToken.symbol();
  
  // Calculate excess stable tokens (total - initial LP amount)
  const stableBalance = balances[2];
  const excessStableTokens = parseEther("23"); //stableBalance - INITIAL_LP_AMOUNT;
  console.log(`\nExcess ${stableTokenSymbol} to distribute:`, formatEther(excessStableTokens));

  // Get winner transfers and combine amounts for same address
  const PlayerATokenFactory = await ethers.getContractFactory("PlayerAToken");
  const playerAToken = PlayerATokenFactory.attach(TOKEN_ADDRESS) as PlayerAToken;
  const transferFilter = playerAToken.filters.Transfer(VAULT_ADDRESS);
  const transferEvents = await playerAToken.queryFilter(transferFilter);

  // Group transfers by recipient address
  const combinedTransfers = transferEvents.reduce((acc, event) => {
    const address = event.args.to;
    acc[address] = (acc[address] || 0n) + event.args.value;
    return acc;
  }, {} as { [key: string]: bigint });

  // Calculate total tokens transferred
  const totalTokensTransferred = Object.values(combinedTransfers)
    .reduce((acc, value) => acc + value, 0n);

  // Calculate distribution for each unique winner
  console.log("\n=== Winner Distribution ===");
  console.log("Total excess stable tokens:", formatEther(excessStableTokens));
  console.log("Total player tokens transferred:", formatEther(totalTokensTransferred));

  const distributions = await Promise.all(
    Object.entries(combinedTransfers).map(async ([address, tokenAmount]) => {
      // Calculate proportion with higher precision
      const proportion = (tokenAmount * BigInt(1e18)) / totalTokensTransferred;
      const stableTokenShare = (excessStableTokens * proportion) / BigInt(1e18);

      console.log(`\nCalculation for ${address}:`);
      console.log(`Player tokens: ${formatEther(tokenAmount)}`);
      console.log(`Proportion raw: ${proportion}`);
      console.log(`Stable token share raw: ${stableTokenShare}`);

      return {
        winner: address,
        playerTokens: formatEther(tokenAmount),
        proportion: `${Number(formatEther(proportion)) * 100}%`,
        stableTokenShare,
        stableTokenShareFormatted: formatEther(stableTokenShare)
      };
    })
  );

  // Display distributions
  distributions.forEach((dist, index) => {
    console.log(`\nWinner #${index + 1}:`);
    console.log(`Address: ${dist.winner}`);
    console.log(`Player Tokens: ${dist.playerTokens}`);
    console.log(`Proportion: ${dist.proportion}`);
    console.log(`${stableTokenSymbol} Share: ${dist.stableTokenShareFormatted}`);
  });

  if (mode === 'payoutTransfer') {
    console.log("\n=== Withdrawing and Distributing Stable Tokens ===");
    
    // 1. Check initial balances
    const controllerBalance = await stableToken.balanceOf(controller.target);
    console.log(`Initial Controller balance: ${formatEther(controllerBalance)} ${stableTokenSymbol}`);
    
    // 2. Disable swaps and joins/exits first
    await controller.setSwapEnabled(false);
    await controller.setJoinExitEnabled(false);
    console.log("Disabled swaps and joins/exits");
    
    // 3. Withdraw stable tokens from pool
    const withdrawTx = await controller.withdrawFromPool(stableToken.target, excessStableTokens);
    await withdrawTx.wait();
    console.log("Withdrawn stable tokens from pool");

    // 4. Verify Controller balance after withdrawal
    const balanceAfterWithdraw = await stableToken.balanceOf(controller.target);
    console.log(`Controller balance after withdraw: ${formatEther(balanceAfterWithdraw)} ${stableTokenSymbol}`);

    // 5. Prepare arrays for batchTransfer
    const winnerAddresses = distributions.map(dist => dist.winner);
    const amounts = distributions.map(dist => dist.stableTokenShare);

    console.log("\nPreparing transfers from Controller:");
    winnerAddresses.forEach((addr, i) => {
      console.log(`${addr}: ${formatEther(amounts[i])} ${stableTokenSymbol}`);
    });

    // Verify conditions before batch transfer
    const swapEnabled = await controller.getSwapEnabled();
    const joinExitEnabled = await controller.getJoinExitEnabled();
    console.log("Swap enabled:", swapEnabled);
    console.log("Join/Exit enabled:", joinExitEnabled);
    
    // Execute batch transfer only if conditions are met
    if (!swapEnabled && !joinExitEnabled) {
      const batchTx = await controller.batchTransfer(
        winnerAddresses,
        amounts,
        stableToken.target
      );
      await batchTx.wait();
    } else {
      console.log("Error: Disable swaps and joins/exits first");
    }

    // 7. Verify final balances
    console.log("\nFinal Balances:");
    const finalControllerBalance = await stableToken.balanceOf(controller.target);
    console.log(`Controller final balance: ${formatEther(finalControllerBalance)} ${stableTokenSymbol}`);
    
    for (const addr of winnerAddresses) {
      const balance = await stableToken.balanceOf(addr);
      console.log(`${addr} balance: ${formatEther(balance)} ${stableTokenSymbol}`);
    }
  } else {
    console.log("\n=== Payout Check Mode - No withdrawals or transfers executed ===");
  }

  // Verify total distribution
  const totalDistributed = distributions.reduce((acc, dist) => 
    acc + Number(dist.stableTokenShareFormatted), 0
  );
  console.log(`\nTotal ${stableTokenSymbol} to be distributed:`, totalDistributed);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 