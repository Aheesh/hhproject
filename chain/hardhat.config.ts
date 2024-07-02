// import * as dotenv from "dotenv";
// dotenv.config();
import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "@nomicfoundation/hardhat-verify";

const providerApiKey = process.env.ALCHEMY_API_KEY;
const providerInfuraKey = process.env.INFURA_API_KEY;
const providerBaseKey = process.env.BASE_PROVIDER_API_KEY;
// If not set, it uses the hardhat account 0 private key.
const deployerPrivateKey =
  process.env.DEPLOYER_PRIVATE_KEY ??
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const user1PrivateKey =
  process.env.USER1_PRIVATE_KEY ??
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const deployerBasePrivateKey =
  process.env.BASE_DEPLOYER_PRIVATE_KEY ??
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const etherscanApiKey = process.env.ETHERSCAN_API_KEY;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{ version: "0.8.20" }, { version: "0.7.1" }],
  },
  paths: {
    sources: "./contracts",
  },
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: {
      default: 0,
      localhost: 0,
      sepolia: 0,
      base: 0,
    },
    user1: {
      default: 1,
      localhost: 1,
      sepolia: 1,
    },
  },
  networks: {
    // View the networks that are pre-configured.
    // If the network you are looking for is not here you can add new network settings
    // url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,

    hardhat: {
      loggingEnabled: true,
      forking: {
        url: `https://eth-mainnet.g.alchemy.com/v2/${providerApiKey}`,
        blockNumber: 19685500,
        enabled: process.env.MAINNET_FORKING_ENABLED === "true",
      },
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      accounts: [deployerPrivateKey, user1PrivateKey],
      gasPrice: 9000000000, // 9 gwei
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    base: {
      url: `https://base-mainnet.g.alchemy.com/v2/${providerBaseKey}`,
      accounts: [deployerBasePrivateKey],
    },
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true,
  },
};

export default config;
