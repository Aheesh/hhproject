// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

/**
 * @title marketToken
 * @notice Factory for a creating tokens required for the market.
 * @dev Determine the game probability and no of tokens required for the game.
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract PlayerAToken is ERC20, Ownable {
    address private deployer;
    address private vault;
    address private controller;

    event PlayerATokenApproved(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    constructor(address _vault, uint256 amount) ERC20("PlayerA", "PA") {
        console.log(
            unicode"💸💸💸MINT-Player A💸💸💸",
            "Deploying a marketToken with initial supply of",
            amount
        );
        deployer = msg.sender;
        vault = _vault;
        console.log("Contructor() - Token A deployer address", deployer);
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

    function transferManager(address _from) private view returns (bool) {
        if (_from == deployer || _from == vault || _from == controller)
            return true;
        else return false;
    }

    function transfer(
        address _to,
        uint256 _value
    ) public override returns (bool) {
        require(
            transferManager(msg.sender),
            "Transfer permitted only from token deployer, controller or vault"
        );
        console.log(" transfer call from msg.sender ==>", msg.sender);
        super.transfer(_to, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public override returns (bool) {
        require(
            transferManager(_from),
            "Transfer only permitted from deployer or vault"
        );
        super.transferFrom(_from, _to, _value);
        return true;
    }

    function setController(address _controller) public onlyOwner {
        controller = _controller;
        console.log("Controller set to", _controller);
    }
}
