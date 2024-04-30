// SPDX-License-Identifier: GPL-3.0-or-later
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

pragma solidity >=0.7.0 <0.9.0;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";

import "@balancer-labs/v2-interfaces/contracts/vault/IVault.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-utils/IManagedPool.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-utils/ILastCreatedPoolFactory.sol";

/**
 * @title Controller
 * @notice This is a Managed Pool Controller that exists to be the owner of Managed Pools.
 */
contract Controller {
    IVault private immutable _vault;
    bytes32 private immutable _poolId;

    constructor(IVault vault, bytes32 poolId) {
        if (poolId == 0x0) {
            poolId = IManagedPool(
                ILastCreatedPoolFactory(msg.sender).getLastCreatedPool()
            ).getPoolId();
        }
        // Verify that this is a real Vault and the pool is registered - this call will revert if not.
        vault.getPool(poolId);

        //Store the vault and poolId
        _vault = vault;
        _poolId = poolId;
    }

    function getPoolId() public view returns (bytes32) {
        return _poolId;
    }

    function getVault() public view returns (IVault) {
        return _vault;
    }

    //function to get the pool tokens from the vault calling the IVault.getPoolTokens function
    function getPoolTokens()
        public
        view
        returns (address[] memory, uint256[] memory, uint256)
    {
        IERC20[] memory tokenContracts;
        uint256[] memory balances;
        uint256 totalBalance;

        (tokenContracts, balances, totalBalance) = _vault.getPoolTokens(
            _poolId
        );

        address[] memory tokens = new address[](tokenContracts.length);
        for (uint i = 0; i < tokenContracts.length; i++) {
            tokens[i] = address(tokenContracts[i]);
            console.log("getPoolTokens: Tokens %s", tokens[i]);
        }

        return (tokens, balances, totalBalance);
    }

    //function to get the pool specialization from the vault calling the IVault.getPoolSpecialization function
    function getPoolSpecialization()
        public
        view
        returns (address, IVault.PoolSpecialization)
    {
        address poolAddress;
        IVault.PoolSpecialization poolSpecialization;
        (poolAddress, poolSpecialization) = _vault.getPool(_poolId);
        console.log("getPoolSpecialization: Pool Address", poolAddress);
        return (poolAddress, poolSpecialization);
    }

    //Function to allow EOA to join the pool calling the IVault.joinPool function

    function joinPool(
        address sender,
        address recipient,
        IVault.JoinPoolRequest memory request
    ) external payable {
        console.log("Controller - joinPool() requst");
        _vault.joinPool(_poolId, sender, recipient, request);
    }

    //function to check if joining and exiting pool is enabled
    function getJoinExitEnabled() external view returns (bool) {
        console.log(
            "get Managed pool Join / Exit status - getJoinExitEnabled "
        );
        (address poolAddress, ) = _vault.getPool(_poolId);
        return IManagedPool(poolAddress).getJoinExitEnabled();
    }

    //function to check status of the pool
    function getSwapEnabled() external view returns (bool) {
        console.log("Managed Pool getSwapEnabled");
        (address poolAddress, ) = _vault.getPool(_poolId);
        return IManagedPool(poolAddress).getSwapEnabled();
    }

    //Function to set Managed Pool Join / Exit flag
    function setJoinExitEnabled(bool joinExitEnabled) public {
        (address poolAddress, ) = _vault.getPool(_poolId);
        console.log("Managed Pool setJoinExitEnabled");
        return IManagedPool(poolAddress).setJoinExitEnabled(joinExitEnabled);
    }

    //function to get Authorizer
    function getAuthorizer() public view returns (IAuthorizer) {
        return _vault.getAuthorizer();
    }
}
