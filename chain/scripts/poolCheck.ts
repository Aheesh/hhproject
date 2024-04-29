//script to connect to the pool and get pool tokens using the Controller contract getPoolTokens()

import hre from "hardhat";

const func = async () => {
  console.log("Starting");
  const { deployments } = hre;
  //await deployments.fixture();
  const deployment = await deployments.get("Controller");
  console.log("Controller Address : ", deployment.address);
  const controller = await hre.ethers.getContractAt(
    "Controller",
    deployment.address
  );
  const [addresses, balance, totalBalance] = await controller.getPoolTokens();
  console.log("Pool Tokens Addresses: ", addresses);
  console.log("Pool Tokens Amounts: ", balance);
  console.log("Total Pool Tokens Amount: ", totalBalance);

  const [poolAddress, poolSpecialization] =
    await controller.getPoolSpecialization();
  console.log("Pool Address and Specialization", poolAddress);
  console.log("Pool Specialization", poolSpecialization);

  const poolJoinExitEnabled = await controller.getJoinExitEnabled();
  console.log("Managed Pool Join Exit Enabled status", poolJoinExitEnabled);

  const poolJoinExitDisable = await controller.set;
  console.log("Join Disbaled", poolJoinExitDisable);

  const poolSwapEnabled = await controller.getSwapEnabled();
  console.log("Swap Enabled status", poolSwapEnabled);
};

try {
  console.log("Calling function");
  func();
} catch (error) {
  console.error("An error occurred:", error);
}
