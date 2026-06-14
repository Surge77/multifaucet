// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {MultiFaucetToken} from "../src/MultiFaucetToken.sol";
import {TokenFaucet} from "../src/TokenFaucet.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Deploys MultiFaucetToken + TokenFaucet and seeds the faucet.
/// @dev Run per chain with the matching RPC + scan key, e.g.
///   forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL \
///     --private-key $DEPLOYER_PRIVATE_KEY --broadcast --verify \
///     --etherscan-api-key $ETHERSCAN_API_KEY
contract Deploy is Script {
    uint256 internal constant DRIP = 100e18;
    uint256 internal constant INITIAL_FUNDING = 1_000_000e18;

    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        // Address matching the backend's FAUCET_SIGNER_PRIVATE_KEY; it authorizes
        // claim vouchers. Keep the private half off-chain in the API only.
        address signer = vm.envAddress("FAUCET_SIGNER_ADDRESS");

        vm.startBroadcast(pk);
        MultiFaucetToken token = new MultiFaucetToken(deployer);
        TokenFaucet faucet = new TokenFaucet(IERC20(address(token)), DRIP, signer, deployer);
        token.mint(address(faucet), INITIAL_FUNDING);
        vm.stopBroadcast();

        console2.log("MultiFaucetToken:", address(token));
        console2.log("TokenFaucet:     ", address(faucet));
    }
}
