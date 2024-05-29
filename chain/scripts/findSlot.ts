import { ethers } from "hardhat";

async function getBalance(
  contractAddress: string,
  account: string
): Promise<ethers.BigNumber> {
  const slotNumber = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [account, 0])
  );

  const balance = await ethers.provider.send("hardhat_getStorageAt", [
    contractAddress,
    slotNumber,
  ]);

  return ethers.BigNumber.from(balance);
}

// Example usage
const contractAddress = "0x04F75a27cE2FDC591C71a88f1EcaC7e5Ce44f5Fc";
const accountAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

getBalance(contractAddress, accountAddress).then(console.log);
