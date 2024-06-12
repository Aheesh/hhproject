//deploy the player Token contracts

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployYourContractDraw: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploy Script 04- Deployer Address: ", deployer);

  // Deploy Stable Token
  await deploy("StableToken", {
    from: deployer,
    args: [1000],
    log: true,
    autoMine: true,
  });

  const deployment = await hre.deployments.get("StableToken");
  console.log("deployed contract address ===", deployment.address);
};

export default deployYourContractDraw;

deployYourContractDraw.tags = ["StableToken"];
