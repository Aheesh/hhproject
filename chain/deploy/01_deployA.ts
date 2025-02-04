//deploy the player Token contracts

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployYourContractA: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploy Script 01- Network name", hre.network.name);
  console.log("Deploy Script 01- Deployer Address: ", deployer);

  // Deploy Player A Token
  await deploy("PlayerAToken", {
    from: deployer,
    args: ["0xBA12222222228d8Ba445958a75a0704d566BF2C8", 140],
    log: true,
    autoMine: true,
  });

  const deployment = await hre.deployments.get("PlayerAToken");
  console.log("deployed contract address ===", deployment.address);
};

export default deployYourContractA;

deployYourContractA.tags = ["PlayerAToken"];
