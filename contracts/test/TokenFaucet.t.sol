// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {TokenFaucet} from "../src/TokenFaucet.sol";
import {MultiFaucetToken} from "../src/MultiFaucetToken.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract TokenFaucetTest is Test {
    MultiFaucetToken internal token;
    TokenFaucet internal faucet;

    address internal owner = address(this);
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    uint256 internal constant DRIP = 100e18;
    uint256 internal constant COOLDOWN = 24 hours;
    uint256 internal constant FUNDING = DRIP * 10;

    event Claimed(address indexed to, uint256 amount, uint256 timestamp);
    event DripAmountUpdated(uint256 newDripAmount);
    event Funded(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    function setUp() public {
        token = new MultiFaucetToken(owner);
        faucet = new TokenFaucet(IERC20(address(token)), DRIP, owner);
        token.mint(address(faucet), FUNDING);
        vm.warp(1_000_000); // non-zero base timestamp
    }

    // --- constructor ---------------------------------------------------------

    function test_Constructor_RevertsOnZeroDrip() public {
        vm.expectRevert(TokenFaucet.InvalidDripAmount.selector);
        new TokenFaucet(IERC20(address(token)), 0, owner);
    }

    function test_Constructor_SetsState() public view {
        assertEq(address(faucet.token()), address(token));
        assertEq(faucet.dripAmount(), DRIP);
        assertEq(faucet.owner(), owner);
        assertEq(faucet.COOLDOWN(), COOLDOWN);
    }

    // --- claim ---------------------------------------------------------------

    function test_FirstClaim_TransfersDripAndEmits() public {
        vm.expectEmit(true, false, false, true, address(faucet));
        emit Claimed(alice, DRIP, block.timestamp);

        vm.prank(alice);
        faucet.claim();

        assertEq(token.balanceOf(alice), DRIP);
        assertEq(faucet.lastClaim(alice), block.timestamp);
    }

    function test_SecondClaim_WithinCooldown_Reverts() public {
        vm.prank(alice);
        faucet.claim();

        vm.warp(block.timestamp + COOLDOWN - 1);
        vm.expectRevert(abi.encodeWithSelector(TokenFaucet.CooldownActive.selector, 1));
        vm.prank(alice);
        faucet.claim();
    }

    function test_Claim_AfterCooldown_Succeeds() public {
        vm.prank(alice);
        faucet.claim();

        vm.warp(block.timestamp + COOLDOWN);
        vm.prank(alice);
        faucet.claim();

        assertEq(token.balanceOf(alice), DRIP * 2);
    }

    function test_Claim_RevertsWhenFaucetEmpty() public {
        faucet.withdraw(FUNDING); // owner drains
        vm.expectRevert(TokenFaucet.FaucetEmpty.selector);
        vm.prank(alice);
        faucet.claim();
    }

    function test_Claim_RevertsWhenPaused() public {
        faucet.pause();
        vm.expectRevert(Pausable.EnforcedPause.selector);
        vm.prank(alice);
        faucet.claim();
    }

    function test_DifferentAddresses_ClaimIndependently() public {
        vm.prank(alice);
        faucet.claim();
        vm.prank(bob);
        faucet.claim();

        assertEq(token.balanceOf(alice), DRIP);
        assertEq(token.balanceOf(bob), DRIP);
    }

    // --- timeUntilNextClaim / canClaim --------------------------------------

    function test_TimeUntilNextClaim_ZeroBeforeFirstClaim() public view {
        assertEq(faucet.timeUntilNextClaim(alice), 0);
    }

    function test_TimeUntilNextClaim_DecreasesToZero() public {
        vm.prank(alice);
        faucet.claim();

        assertEq(faucet.timeUntilNextClaim(alice), COOLDOWN);
        vm.warp(block.timestamp + COOLDOWN / 2);
        assertEq(faucet.timeUntilNextClaim(alice), COOLDOWN / 2);
        vm.warp(block.timestamp + COOLDOWN / 2);
        assertEq(faucet.timeUntilNextClaim(alice), 0);
    }

    function test_CanClaim_TrueWhenReady() public view {
        assertTrue(faucet.canClaim(alice));
    }

    function test_CanClaim_FalseDuringCooldown() public {
        vm.prank(alice);
        faucet.claim();
        assertFalse(faucet.canClaim(alice));
    }

    function test_CanClaim_FalseWhenPaused() public {
        faucet.pause();
        assertFalse(faucet.canClaim(alice));
    }

    function test_CanClaim_FalseWhenEmpty() public {
        faucet.withdraw(FUNDING);
        assertFalse(faucet.canClaim(alice));
    }

    // --- admin ---------------------------------------------------------------

    function test_SetDripAmount_OwnerSucceeds() public {
        vm.expectEmit(false, false, false, true, address(faucet));
        emit DripAmountUpdated(5e18);
        faucet.setDripAmount(5e18);
        assertEq(faucet.dripAmount(), 5e18);
    }

    function test_SetDripAmount_RevertsOnZero() public {
        vm.expectRevert(TokenFaucet.InvalidDripAmount.selector);
        faucet.setDripAmount(0);
    }

    function test_SetDripAmount_NonOwnerReverts() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        vm.prank(alice);
        faucet.setDripAmount(5e18);
    }

    function test_Fund_PullsTokensFromCaller() public {
        token.mint(alice, DRIP);
        vm.startPrank(alice);
        token.approve(address(faucet), DRIP);
        vm.expectEmit(true, false, false, true, address(faucet));
        emit Funded(alice, DRIP);
        faucet.fund(DRIP);
        vm.stopPrank();

        assertEq(token.balanceOf(address(faucet)), FUNDING + DRIP);
    }

    function test_Withdraw_OwnerSucceedsAndEmits() public {
        vm.expectEmit(true, false, false, true, address(faucet));
        emit Withdrawn(owner, DRIP);
        faucet.withdraw(DRIP);
        assertEq(token.balanceOf(owner), DRIP);
    }

    function test_Withdraw_NonOwnerReverts() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        vm.prank(alice);
        faucet.withdraw(DRIP);
    }

    function test_PauseUnpause_OwnerOnly() public {
        faucet.pause();
        assertTrue(faucet.paused());
        faucet.unpause();
        assertFalse(faucet.paused());
    }

    function test_Pause_NonOwnerReverts() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        vm.prank(alice);
        faucet.pause();
    }

    function test_Unpause_NonOwnerReverts() public {
        faucet.pause();
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        vm.prank(alice);
        faucet.unpause();
    }

    // --- fuzz ----------------------------------------------------------------

    function testFuzz_ClaimableIffCooldownElapsed(uint256 elapsed) public {
        elapsed = bound(elapsed, 0, COOLDOWN * 3);
        vm.prank(alice);
        faucet.claim();
        uint256 claimedAt = block.timestamp;

        vm.warp(claimedAt + elapsed);

        if (elapsed >= COOLDOWN) {
            assertEq(faucet.timeUntilNextClaim(alice), 0);
            vm.prank(alice);
            faucet.claim(); // should not revert
        } else {
            assertEq(faucet.timeUntilNextClaim(alice), COOLDOWN - elapsed);
            vm.expectRevert(abi.encodeWithSelector(TokenFaucet.CooldownActive.selector, COOLDOWN - elapsed));
            vm.prank(alice);
            faucet.claim();
        }
    }
}
