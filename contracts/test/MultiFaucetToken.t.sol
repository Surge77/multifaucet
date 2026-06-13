// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {MultiFaucetToken} from "../src/MultiFaucetToken.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MultiFaucetTokenTest is Test {
    MultiFaucetToken internal token;
    address internal owner = address(this);
    address internal alice = makeAddr("alice");

    function setUp() public {
        token = new MultiFaucetToken(owner);
    }

    function test_Metadata() public view {
        assertEq(token.name(), "MultiFaucet Token");
        assertEq(token.symbol(), "MFT");
        assertEq(token.decimals(), 18);
        assertEq(token.owner(), owner);
    }

    function test_Mint_OwnerSucceeds() public {
        token.mint(alice, 1_000e18);
        assertEq(token.balanceOf(alice), 1_000e18);
        assertEq(token.totalSupply(), 1_000e18);
    }

    function test_Mint_NonOwnerReverts() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        vm.prank(alice);
        token.mint(alice, 1e18);
    }
}
