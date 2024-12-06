import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployStableToken: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploy Script 04 - Deployer Address: ", deployer);

  // Deploy Stable Token with 1000 units
  await deploy("StableToken", {
    from: deployer,
    args: [1000],
    log: true,
    autoMine: true,
  });

  const deployment = await hre.deployments.get("StableToken");
  console.log("Deployed StableToken contract address ===", deployment.address);
};

export default deployStableToken;

deployStableToken.tags = ["StableToken"]; 