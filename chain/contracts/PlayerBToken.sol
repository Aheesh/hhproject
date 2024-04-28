// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

/**
 * @title marketToken
 * @notice Factory for a creating tokens required for the market.
 * @dev Determine the game probability and no of tokens required for the game.
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract PlayerBToken is ERC20 {
    event PlayerBTokenApproved(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    constructor(uint256 amount) ERC20("PlayerB", "PB") {
        console.log(
            unicode"💸💸💸MINT-Player B💸💸💸",
            "constructor : MarketToken B with initial supply of",
            amount
        );
        _mint(msg.sender, amount * 10 ** 18);
    }

    function approve(
        address spender,
        uint256 amount
    ) public override returns (bool) {
        emit PlayerBTokenApproved(msg.sender, spender, amount);
        return super.approve(spender, amount);
    }

    function checkBalance(address account) public view returns (uint256) {
        return balanceOf(account);
    }
}
