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

import "@balancer-labs/v2-solidity-utils/contracts/openzeppelin/Ownable.sol";

/**
 * @title Controller
 * @notice This is a Managed Pool Controller that exists to be the owner of Managed Pools.
 */
contract Controller is Ownable {
    IVault private immutable _vault;
    bytes32 private immutable _poolId;
    bool private _distributeWinningTokens = false;

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
        }

        return (tokens, balances, totalBalance);
    }

    //function to get the pool tokens info on cash , managed balance and assetManager calling the IVault.getPoolTokensInfo function
    function getPoolTokenInfo(
        IERC20 token
    ) public view returns (uint256, uint256, uint256, address) {
        (
            uint256 cashBalance,
            uint256 managedBalance,
            uint256 lastChangeBlock,
            address assetManager
        ) = _vault.getPoolTokenInfo(_poolId, token);
        return (cashBalance, managedBalance, lastChangeBlock, assetManager);
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
        return (poolAddress, poolSpecialization);
    }

    //function to check if joining and exiting pool is enabled
    function getJoinExitEnabled() external view returns (bool) {
        (address poolAddress, ) = _vault.getPool(_poolId);
        return IManagedPool(poolAddress).getJoinExitEnabled();
    }

    //function to check status of the pool
    function getSwapEnabled() external view returns (bool) {
        (address poolAddress, ) = _vault.getPool(_poolId);
        return IManagedPool(poolAddress).getSwapEnabled();
    }

    //function to set swap enabled flag
    function setSwapEnabled(bool swapEnabled) public {
        (address poolAddress, ) = _vault.getPool(_poolId);
        return IManagedPool(poolAddress).setSwapEnabled(swapEnabled);
    }

    //Function to set Managed Pool Join / Exit flag
    function setJoinExitEnabled(bool joinExitEnabled) public {
        (address poolAddress, ) = _vault.getPool(_poolId);
        return IManagedPool(poolAddress).setJoinExitEnabled(joinExitEnabled);
    }

    // Approve the Vault contract to spend tokens
    function approveVault(address token, uint256 amount) public {
        // console.log(
        //     "Controller - approveToken() request",
        //     msg.sender,
        //     address(this),
        //     amount
        // );
        IERC20(token).approve(address(_vault), amount);
        // console.log(
        //     "Controller Allowance of token",
        //     token,
        //     IERC20(token).allowance(address(this), address(_vault))
        // );
    }

    //function to transfer token to controller contract
    function transferToken(address token, uint256 amount) public {
        // console.log(
        //     "Controller - transferToken function call - start ",
        //     amount
        // );
        // console.log(
        //     "Controller - transferToken function call - start -->Current Allowance ",
        //     IERC20(token).allowance(msg.sender, address(this))
        // );
        if (IERC20(token).allowance(msg.sender, address(this)) >= amount) {
            IERC20(token).transferFrom(msg.sender, address(this), amount);
            // console.log(
            //     "Controller - transferToken function call - end",
            //     IERC20(token).balanceOf(address(this))
            // );
        } else {
            // console.log("Get additiona allowance");
        }
    }

    //function to init the managed pool
    function initPool(
        address[] memory PoolTokens,
        uint256[] memory amountsIn
    ) external payable {
        IAsset[] memory assets = new IAsset[](PoolTokens.length);
        for (uint i = 0; i < PoolTokens.length; i++) {
            assets[i] = IAsset(address(PoolTokens[i]));
        }
        // Create a new array with the size of amountsIn plus one (for the initial value)
        uint256[] memory weiAmountPerToken = new uint256[](
            1 + amountsIn.length
        );

        // Assign the initial value
        weiAmountPerToken[0] = 5192296858534827628530496329000000;

        // Copy the values from amountsIn
        for (uint i = 0; i < amountsIn.length; i++) {
            weiAmountPerToken[i + 1] = amountsIn[i];
        }

        uint256 JOIN_KIND_INIT = 0;
        bytes memory initUserData = abi.encode(JOIN_KIND_INIT, amountsIn);
        // console.log(
        //     "Controller - initPool() initUserData ===? check next line"
        // );
        console.logBytes(initUserData);

        IVault.JoinPoolRequest memory initJoinPoolRequest = IVault
            .JoinPoolRequest({
                assets: assets,
                maxAmountsIn: weiAmountPerToken,
                userData: initUserData,
                fromInternalBalance: false
            });
        // console.log(
        //     "Controller - initPool() request msg.sender is ",
        //     msg.sender
        // );
        _vault.joinPool(
            _poolId,
            address(this),
            address(this),
            initJoinPoolRequest
        );
        // console.log(
        //     "Controller - initPool() request done for controller ",
        //     address(this)
        // );
    }

    //function to withdraw token cash balance from the pool to asset manager
    function withdrawFromPool(IERC20 token, uint256 amount) public onlyOwner {
        IVault.PoolBalanceOp[] memory ops = new IVault.PoolBalanceOp[](2);

        //Withdraw token, creating a non-zero 'managed' balance in the Pool.
        ops[0].kind = IVault.PoolBalanceOpKind.WITHDRAW;
        ops[0].poolId = _poolId;
        ops[0].amount = amount;
        ops[0].token = token;

        //Clear the 'managed' balance in the Pool.
        ops[1].kind = IVault.PoolBalanceOpKind.UPDATE;
        ops[1].poolId = _poolId;
        ops[1].amount = 0;
        ops[1].token = token;

        _vault.managePoolBalance(ops);
        _distributeWinningTokens = true;
    }

    //function to transfer stable token from controller to winning token holders
    function batchTransfer(
        address[] memory recipients,
        uint256[] memory amounts,
        IERC20 token
    ) public onlyOwner {
        require(_distributeWinningTokens, "stable withdraw not done");
        (address poolAddress, ) = _vault.getPool(_poolId);
        require(
            !IManagedPool(poolAddress).getJoinExitEnabled(),
            "Join/Exit is enabled"
        );
        require(!IManagedPool(poolAddress).getSwapEnabled(), "Swap enabled");
        require(recipients.length == amounts.length, "Array length mismatch");
        for (uint i = 0; i < recipients.length; i++) {
            require(
                token.transfer(recipients[i], amounts[i]),
                "Transfer failed"
            );
            console.log("Transferred ", amounts[i], " to ", recipients[i]);
        }
    }
}
