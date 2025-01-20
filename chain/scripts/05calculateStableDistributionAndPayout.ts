//Script to calculate the distribution of stable tokens to winners set the .env variable MODE to payoutCheck or payoutTransfer
//TODO stable token location in the pool to be fetched automatically
//TODO : transfer the LP amount to the owner 

import { ethers } from "hardhat";
import { PlayerAToken, ERC20, Controller } from "../typechain-types";
import { formatEther, parseEther } from "ethers";
import { getNamedAccounts } from "hardhat";
import dotenv from "dotenv";

//load the env variables
dotenv.config();

const pool_id = process.env.POOL_ID;
const vault_address = process.env.VAULT_ADDRESS;
const INITIAL_LP_AMOUNT = parseEther("500"); // TODO initial LP amount to be fetched automatically
const winning_token_address = process.env.WINNING_TOKEN_ADDRESS;
const controller_address = process.env.MANAGED_POOL_CONTROLLER_ADDRESS;

const mode = process.env.MODE || 'payoutCheck';

if (!['payoutCheck', 'payoutTransfer'].includes(mode)) {
  throw new Error('Invalid mode. Use MODE=payoutCheck or MODE=payoutTransfer');
}

if (!pool_id || !vault_address || !controller_address) {
  throw new Error("Pool ID, Vault Address, or Controller Address is not defined");
}

async function main() {
  // Get deployer address
  const { deployer } = await getNamedAccounts();
  console.log("Deployer address:", deployer);

  const vault = await ethers.getContractAt("IVault", vault_address as string);
  const controller = await ethers.getContractAt("Controller", controller_address as string);
  
  // Get pool tokens and balances
  const [tokens, balances] = await vault.getPoolTokens(pool_id as string);

  // Validate winning token is in the pool and in correct position
  const winningTokenPosition = tokens.findIndex(token => 
    token.toLowerCase() === winning_token_address?.toLowerCase()
  );

  if (winningTokenPosition === -1 || winningTokenPosition === 0 || winningTokenPosition > 4) {
    throw new Error(`Invalid winning token address. Token must be in pool positions 1-4. Found at position: ${winningTokenPosition}`);
  }

  console.log(`Winning token validated at position: ${winningTokenPosition}`);

  // Find stable token position by checking symbols
  let stableTokenIndex = -1;
  for (let i = 0; i < tokens.length; i++) {
    const token = await ethers.getContractAt("ERC20", tokens[i]);
    const symbol = await token.symbol();
    if (symbol === "USDC" || symbol === "USDT" || symbol === "ST" || symbol === "DEGEN") {
      stableTokenIndex = i;
      break;
    }
  }

  if (stableTokenIndex === -1) {
    throw new Error("No stable token found in pool");
  }

  const stableTokenAddress = tokens[stableTokenIndex];
  const stableToken = await ethers.getContractAt("ERC20", stableTokenAddress);
  const stableTokenSymbol = await stableToken.symbol();
  
  // Calculate excess stable tokens (total - initial LP amount)
  const stableBalance = balances[stableTokenIndex]; //TODO stable token location in the pool to be fetched automatically
  const excessStableTokens =  stableBalance - INITIAL_LP_AMOUNT;
  console.log(`\nExcess ${stableTokenSymbol} to distribute:`, formatEther(excessStableTokens));

  // Get winner transfers and combine amounts for same address
  const PlayerATokenFactory = await ethers.getContractFactory("PlayerAToken");
  const playerAToken = PlayerATokenFactory.attach(winning_token_address as string) as PlayerAToken;
  const transferFilter = playerAToken.filters.Transfer(vault_address as string);
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