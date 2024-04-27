//Deployment script for PlayerAToken contract implemented in ./contracts/PlayerAToken.sol
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AMOUNT = 6000;

const PlayerATokenModule = buildModule("PlayerATokenModule", (m) => {
  const tokenAmount = m.getParameter("lockedAmount", AMOUNT);

  const playerAToken = m.contract("PlayerAToken", [tokenAmount], {});

  return { playerAToken };
});

export default PlayerATokenModule;
