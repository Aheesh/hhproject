//deploy the player Token contracts

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployYourContractDraw: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploy Script 03- Deployer Address: ", deployer);

  // Deploy Draw Token
  await deploy("DrawToken", {
    from: deployer,
    args: ["0xBA12222222228d8Ba445958a75a0704d566BF2C8", 180],
    log: true,
    autoMine: true,
  });

  const deployment = await hre.deployments.get("DrawToken");
  console.log("deployed contract address ===", deployment.address);
};

export default deployYourContractDraw;

deployYourContractDraw.tags = ["DrawToken"];
