//Deployment script for PlayerBToken contract implemented in ./contracts/PlayerAToken.sol
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AMOUNT = 3000;

const PlayerBTokenModule = buildModule("PlayerBTokenModule", (m) => {
  const tokenAmount = m.getParameter("lockedAmount", AMOUNT);

  const playerBToken = m.contract("PlayerBToken", [tokenAmount], {});

  return { playerBToken };
});

export default PlayerBTokenModule;
