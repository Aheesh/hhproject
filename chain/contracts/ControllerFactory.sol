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

import "@balancer-labs/v2-interfaces/contracts/vault/IVault.sol";
import "@balancer-labs/v2-interfaces/contracts/pool-utils/IManagedPool.sol";
import "@balancer-labs/v2-solidity-utils/contracts/openzeppelin/Create2.sol";
import "@balancer-labs/v2-solidity-utils/contracts/openzeppelin/Ownable.sol";

import "hardhat/console.sol";

import "./interfaces/IManagedPoolFactory.sol";
import "./Controller.sol";

/**
 * @title ControllerFactory
 * @notice Factory for a Managed Pool and Pool Controller.
 * @dev Determines controller deployment address, deploys pool (w/ controller address as argument), then controller.
 */
contract ControllerFactory is Ownable {
    mapping(address => bool) public isControllerFromFactory;

    address public immutable managedPoolFactory;
    IVault public immutable balancerVault;
    bool public isDisabled;

    uint256 private _nextControllerSalt;
    address private _lastCreatedPool;

    // This struct is a subset of IManagedPoolFactory.NewPoolParams which omits arguments
    // that this factory will override and are therefore unnecessary to provide. It will
    // ultimately be used to populate IManagedPoolFactory.NewPoolParams.
    struct MinimalPoolParams {
        string name;
        string symbol;
        IERC20[] tokens;
        uint256[] normalizedWeights;
        uint256 swapFeePercentage;
        bool swapEnabledOnStart;
        uint256 managementAumFeePercentage;
        uint256 aumFeeId;
    }

    event ControllerCreated(address indexed controller, bytes32 poolId);
    event ControllerFactoryDisabled();

    constructor(IVault vault, address factory) {
        balancerVault = vault;
        managedPoolFactory = factory;
    }

    /**
     * @dev Return the address of the most recently created pool.
     */
    function getLastCreatedPool() external view returns (address) {
        return _lastCreatedPool;
    }

    /**
     * @dev Create a Managed Pool and a Controller.
     */
    function create(MinimalPoolParams memory minimalParams) external {
        require(!isDisabled, "ControllerFactory: Factory is disabled");

        console.log(
            "ControllerFactory create() require !isDisabled ",
            isDisabled
        );
        console.log(
            "ControllerFactory create() 1 :Name,  ManagedPoolFactory",
            minimalParams.name,
            managedPoolFactory
        );
        console.log(
            "!IManagedPoolFactory",
            IManagedPoolFactory(managedPoolFactory).isDisabled()
        );
        require(
            !IManagedPoolFactory(managedPoolFactory).isDisabled(),
            "ControllerFactory create(): ManagedPoolFactory is disabled"
        );

        bytes32 controllerSalt = bytes32(_nextControllerSalt);
        _nextControllerSalt++;

        bytes memory controllerCreationCode = abi.encodePacked(
            type(Controller).creationCode,
            // TODO remove zeroed (0x0) poolId from NullController creation. Used just to deploy a fake NullController
            abi.encode(balancerVault, 0x0)
        );
        address expectedControllerAddress = Create2.computeAddress(
            controllerSalt,
            keccak256(controllerCreationCode)
        );

        // Build arguments to deploy pool from factory.
        address[] memory assetManagers = new address[](
            minimalParams.tokens.length
        );
        for (uint256 i = 0; i < assetManagers.length; i++) {
            assetManagers[i] = expectedControllerAddress;
        }

        // Populate IManagedPoolFactory.ManagedPoolParams with arguments from MinimalPoolParams and
        // other arguments that this factory provides itself.
        IManagedPoolFactory.ManagedPoolParams memory poolParams;

        poolParams.name = minimalParams.name;
        poolParams.symbol = minimalParams.symbol;
        // Asset Managers set to the controller address, not known by deployer until creation.
        poolParams.assetManagers = assetManagers;

        // Populate IManagedPoolFactory.ManagedPoolSettingsParams with arguments from MinimalPoolParams and
        // other arguments that this factory provides itself.
        IManagedPoolFactory.ManagedPoolSettingsParams memory settingsParams;
        settingsParams.tokens = minimalParams.tokens;
        settingsParams.normalizedWeights = minimalParams.normalizedWeights;
        settingsParams.swapFeePercentage = minimalParams.swapFeePercentage;
        settingsParams.swapEnabledOnStart = minimalParams.swapEnabledOnStart;
        // Factory enforces public LPs for MPools with Controller.
        settingsParams.mustAllowListLPs = false;
        settingsParams.managementAumFeePercentage = minimalParams
            .managementAumFeePercentage;
        settingsParams.aumFeeId = minimalParams.aumFeeId;

        bytes32 poolSalt = bytes32(_nextControllerSalt);
        _nextControllerSalt++;

        IManagedPool pool = IManagedPool(
            IManagedPoolFactory(managedPoolFactory).create(
                poolParams,
                settingsParams,
                expectedControllerAddress,
                poolSalt
            )
        );
        _lastCreatedPool = address(pool);

        console.log(
            "ControllerFactory create(): Managed Pool created",
            _lastCreatedPool
        );

        address actualControllerAddress = Create2.deploy(
            0,
            controllerSalt,
            controllerCreationCode
        );
        require(
            expectedControllerAddress == actualControllerAddress,
            "ControllerFactory: Controller address mismatch"
        );

        //Log controller creation locally
        isControllerFromFactory[actualControllerAddress] = true;
        //Log controller creation globally
        console.log(
            "ControllerFactory create(): Controller created",
            actualControllerAddress
        );
        // set controller owner to deployer
        Controller(actualControllerAddress).transferOwnership(msg.sender);

        emit ControllerCreated(actualControllerAddress, pool.getPoolId());
    }

    /**
     * @dev Allow the owner to disable the factory, preventing future deployments.
     * @notice owner is initially the factory deployer, but this role can be transferred.
     * @dev The onlyOwner access control paradigm is an example. Any access control can
     * be implemented to allow for different needs.
     */
    function disable() external onlyOwner {
        isDisabled = true;
        emit ControllerFactoryDisabled();
    }
}
