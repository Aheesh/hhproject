import { ethers } from "hardhat";
import { IERC20Metadata } from "../typechain-types/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata";

async function main() {
  const poolTokens = [
   '0xAE306F81E0075e0430217aaA88A081b43aaFE577',
  '0x364C7188028348566E38D762f6095741c49f492B',
  '0x5147c5C1Cb5b5D3f56186C37a4bcFBb3Cd0bD5A7',
  '0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9',
  '0xF62eEc897fa5ef36a957702AA4a45B58fE8Fe312'
  ];

  const [signer] = await ethers.getSigners();
  console.log("Checking balances for address:", signer.address);

  for (const tokenAddress of poolTokens) {
    const token = await ethers.getContractAt("IERC20Metadata", tokenAddress) as IERC20Metadata;
    const symbol = await token.symbol();
    const balance = await token.balanceOf(signer.address);
    const decimals = await token.decimals();
    
    console.log(`Token ${symbol} (${tokenAddress})`);
    console.log(`Balance: ${ethers.formatUnits(balance, decimals)}\n`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

