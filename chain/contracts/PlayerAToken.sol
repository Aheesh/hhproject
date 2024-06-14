// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

/**
 * @title marketToken
 * @notice Factory for a creating tokens required for the market.
 * @dev Determine the game probability and no of tokens required for the game.
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract PlayerAToken is ERC20 {
    event PlayerATokenApproved(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    constructor(uint256 amount) ERC20("PlayerA", "PA") {
        console.log(
            unicode"💸💸💸MINT-Player A💸💸💸",
            "Deploying a marketToken with initial supply of",
            amount
        );
        _mint(msg.sender, amount * 10 ** 18);
    }

    function approve(
        address spender,
        uint256 amount
    ) public override returns (bool) {
        emit PlayerATokenApproved(msg.sender, spender, amount);
        console.log("Player A token Approval", msg.sender, spender, amount);
        return super.approve(spender, amount);
    }

    // function checkBalance(address account) public view returns (uint256) {
    //     return balanceOf(account);
    // }
}
