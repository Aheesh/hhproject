import { ethers } from 'ethers';
import * as fs from 'fs';
import dotenv from 'dotenv';
import hre from 'hardhat';

async function main() {
  // Generate new wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log('New Wallet Generated:');
  console.log('Address:', wallet.address);
  console.log('Private Key:', wallet.privateKey);
  

  // Update .env file
  const envContent = `
PROD_DEPLOYER_PRIVATE_KEY=${wallet.privateKey}
PROD_DEPLOYER_ADDRESS=${wallet.address}
# Existing env variables...
`;

  fs.writeFileSync('.env.deploy', envContent);
  console.log('\nWallet credentials saved to .env.deploy');
  console.log(hre.network.name === 'localhost' ? '' : '\nIMPORTANT: Fund this address with ETH before deployment!');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 