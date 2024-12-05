//deploy the player Token contracts

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployYourContractB: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploy Script 02- Deployer Address: ", deployer);

  // Deploy Player B Token
  await deploy("PlayerBToken", {
    from: deployer,
    args: ["0xBA12222222228d8Ba445958a75a0704d566BF2C8", 300],
    log: true,
    autoMine: true,
  });

  const deployment = await hre.deployments.get("PlayerBToken");
  console.log("Deploy Script 02- deployed contract address ===", deployment.address);
};

export default deployYourContractB;

deployYourContractB.tags = ["PlayerBToken"];
