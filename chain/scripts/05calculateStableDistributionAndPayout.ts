//Script to calculate the distribution of stable tokens to winners set the .env variable MODE to payoutCheck or payoutTransfer
//TODO stable token location in the pool to be fetched automatically
//TODO : transfer the LP amount to the owner 

import { ethers } from "hardhat";
import { PlayerAToken, ERC20, Controller } from "../typechain-types";
import { formatEther, parseEther } from "ethers";
import { getNamedAccounts } from "hardhat";

const POOL_ID = "0x35da9476c4e06b521d45d6937172529f2a08fee40001000000000000000001b6";
const VAULT_ADDRESS = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
const INITIAL_LP_AMOUNT = parseEther("500"); // TODO initial LP amount to be fetched automatically
const TOKEN_ADDRESS = "0x64f5219563e28EeBAAd91Ca8D31fa3b36621FD4f";
const CONTROLLER_ADDRESS = "0x3e2A86884CF49a584f7873090825Ac311c76D609";

const mode = process.env.MODE || 'payoutCheck';

if (!['payoutCheck', 'payoutTransfer'].includes(mode)) {
  throw new Error('Invalid mode. Use MODE=payoutCheck or MODE=payoutTransfer');
}

async function main() {
  // Get deployer address
  const { deployer } = await getNamedAccounts();
  console.log("Deployer address:", deployer);

  const vault = await ethers.getContractAt("IVault", VAULT_ADDRESS);
  const controller = await ethers.getContractAt("Controller", CONTROLLER_ADDRESS);
  
  // Get pool tokens and balances
  const [tokens, balances] = await vault.getPoolTokens(POOL_ID);
  const stableTokenAddress = tokens[2]; //TODO stable token location in the pool to be fetched automatically
  const stableToken = await ethers.getContractAt("ERC20", stableTokenAddress);
  const stableTokenSymbol = await stableToken.symbol();
  
  // Calculate excess stable tokens (total - initial LP amount)
  const stableBalance = balances[2]; //TODO stable token location in the pool to be fetched automatically
  const excessStableTokens =  stableBalance - INITIAL_LP_AMOUNT;
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
    
    // 3. Withdraw ALL stable tokens from pool (including INITIAL_LP_AMOUNT)
    const totalWithdrawAmount = stableBalance;  // Changed from excessStableTokens
    const withdrawTx = await controller.withdrawFromPool(stableToken.target, totalWithdrawAmount);
    await withdrawTx.wait();
    console.log("Withdrawn all stable tokens from pool");

    // 4. Transfer INITIAL_LP_AMOUNT to deployer
    console.log(`\nTransferring initial LP amount to deployer:`);
    console.log(`Amount: ${formatEther(INITIAL_LP_AMOUNT)} ${stableTokenSymbol}`);
    console.log(`Deployer address: ${deployer}`);
    
    const deployerTransferTx = await controller.batchTransfer(
      [deployer],
      [INITIAL_LP_AMOUNT],
      stableToken.target
    );
    await deployerTransferTx.wait();
    console.log("Transferred initial LP amount to deployer");

    // 5. Distribute remaining tokens to winners
    console.log("\nPreparing transfers to winners:");
    const winnerAddresses = distributions.map(dist => dist.winner);
    const amounts = distributions.map(dist => dist.stableTokenShare);

    winnerAddresses.forEach((addr, i) => {
      console.log(`${addr}: ${formatEther(amounts[i])} ${stableTokenSymbol}`);
    });
    
    const batchTx = await controller.batchTransfer(
      winnerAddresses,
      amounts,
      stableToken.target
    );
    await batchTx.wait();
    console.log("Transferred tokens to winners");

    // 6. Verify final balances
    console.log("\nFinal Balances:");
    const finalControllerBalance = await stableToken.balanceOf(controller.target);
    console.log(`Controller final balance: ${formatEther(finalControllerBalance)} ${stableTokenSymbol}`);
    
    const deployerBalance = await stableToken.balanceOf(deployer);
    console.log(`Deployer balance: ${formatEther(deployerBalance)} ${stableTokenSymbol}`);
    
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