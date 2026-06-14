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

    uint256 internal signerPk = 0xA11CE;
    address internal signerAddr;

    uint256 internal constant DRIP = 100e18;
    uint256 internal constant COOLDOWN = 24 hours;
    uint256 internal constant FUNDING = DRIP * 10;

    uint256 internal nextNonce = 1;

    event Claimed(address indexed to, uint256 amount, uint256 timestamp);
    event DripAmountUpdated(uint256 newDripAmount);
    event SignerUpdated(address indexed newSigner);
    event Funded(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    function setUp() public {
        signerAddr = vm.addr(signerPk);
        token = new MultiFaucetToken(owner);
        faucet = new TokenFaucet(IERC20(address(token)), DRIP, signerAddr, owner);
        token.mint(address(faucet), FUNDING);
        vm.warp(1_000_000); // non-zero base timestamp
    }

    // --- voucher helpers -----------------------------------------------------

    function _sign(uint256 pk, address recipient, uint256 nonce, uint256 deadline)
        internal
        view
        returns (bytes memory)
    {
        bytes32 digest = faucet.claimDigest(recipient, nonce, deadline);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    /// Claim as `who` with a fresh, signer-issued, far-future voucher.
    function _claim(address who) internal {
        uint256 nonce = nextNonce++;
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(signerPk, who, nonce, deadline);
        vm.prank(who);
        faucet.claim(nonce, deadline, sig);
    }

    // --- constructor ---------------------------------------------------------

    function test_Constructor_RevertsOnZeroDrip() public {
        vm.expectRevert(TokenFaucet.InvalidDripAmount.selector);
        new TokenFaucet(IERC20(address(token)), 0, signerAddr, owner);
    }

    function test_Constructor_RevertsOnZeroSigner() public {
        vm.expectRevert(TokenFaucet.ZeroSigner.selector);
        new TokenFaucet(IERC20(address(token)), DRIP, address(0), owner);
    }

    function test_Constructor_SetsState() public view {
        assertEq(address(faucet.token()), address(token));
        assertEq(faucet.dripAmount(), DRIP);
        assertEq(faucet.owner(), owner);
        assertEq(faucet.signer(), signerAddr);
        assertEq(faucet.COOLDOWN(), COOLDOWN);
    }

    // --- claim (happy path) --------------------------------------------------

    function test_FirstClaim_TransfersDripAndEmits() public {
        uint256 nonce = nextNonce++;
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(signerPk, alice, nonce, deadline);

        vm.expectEmit(true, false, false, true, address(faucet));
        emit Claimed(alice, DRIP, block.timestamp);

        vm.prank(alice);
        faucet.claim(nonce, deadline, sig);

        assertEq(token.balanceOf(alice), DRIP);
        assertEq(faucet.lastClaim(alice), block.timestamp);
        assertTrue(faucet.nonceUsed(nonce));
    }

    function test_Claim_AfterCooldown_Succeeds() public {
        _claim(alice);
        vm.warp(block.timestamp + COOLDOWN);
        _claim(alice);
        assertEq(token.balanceOf(alice), DRIP * 2);
    }

    function test_DifferentAddresses_ClaimIndependently() public {
        _claim(alice);
        _claim(bob);
        assertEq(token.balanceOf(alice), DRIP);
        assertEq(token.balanceOf(bob), DRIP);
    }

    // --- claim (reverts) -----------------------------------------------------

    function test_SecondClaim_WithinCooldown_Reverts() public {
        _claim(alice);

        uint256 nonce = nextNonce++;
        uint256 deadline = block.timestamp + COOLDOWN; // still valid voucher
        bytes memory sig = _sign(signerPk, alice, nonce, deadline);

        vm.warp(block.timestamp + COOLDOWN - 1);
        vm.expectRevert(abi.encodeWithSelector(TokenFaucet.CooldownActive.selector, 1));
        vm.prank(alice);
        faucet.claim(nonce, deadline, sig);
    }

    function test_Claim_RevertsWhenFaucetEmpty() public {
        faucet.withdraw(FUNDING); // owner drains

        uint256 nonce = nextNonce++;
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(signerPk, alice, nonce, deadline);

        vm.expectRevert(TokenFaucet.FaucetEmpty.selector);
        vm.prank(alice);
        faucet.claim(nonce, deadline, sig);
    }

    function test_Claim_RevertsWhenPaused() public {
        faucet.pause();

        uint256 nonce = nextNonce++;
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(signerPk, alice, nonce, deadline);

        vm.expectRevert(Pausable.EnforcedPause.selector);
        vm.prank(alice);
        faucet.claim(nonce, deadline, sig);
    }

    function test_Claim_RevertsOnExpiredVoucher() public {
        uint256 nonce = nextNonce++;
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(signerPk, alice, nonce, deadline);

        vm.warp(deadline + 1);
        vm.expectRevert(TokenFaucet.VoucherExpired.selector);
        vm.prank(alice);
        faucet.claim(nonce, deadline, sig);
    }

    function test_Claim_RevertsOnReplayedNonce() public {
        uint256 nonce = nextNonce++;
        uint256 deadline = block.timestamp + 1 hours;

        bytes memory aliceSig = _sign(signerPk, alice, nonce, deadline);
        vm.prank(alice);
        faucet.claim(nonce, deadline, aliceSig);

        // A fresh, validly-signed voucher for bob reusing the same nonce fails.
        bytes memory bobSig = _sign(signerPk, bob, nonce, deadline);
        vm.expectRevert(TokenFaucet.NonceAlreadyUsed.selector);
        vm.prank(bob);
        faucet.claim(nonce, deadline, bobSig);
    }

    function test_Claim_RevertsOnSignatureFromWrongKey() public {
        uint256 wrongPk = 0xB0B;
        uint256 nonce = nextNonce++;
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(wrongPk, alice, nonce, deadline);

        vm.expectRevert(TokenFaucet.InvalidSignature.selector);
        vm.prank(alice);
        faucet.claim(nonce, deadline, sig);
    }

    function test_Claim_RevertsWhenVoucherBoundToOtherRecipient() public {
        // Voucher signed for alice; bob (msg.sender) cannot redeem it.
        uint256 nonce = nextNonce++;
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(signerPk, alice, nonce, deadline);

        vm.expectRevert(TokenFaucet.InvalidSignature.selector);
        vm.prank(bob);
        faucet.claim(nonce, deadline, sig);
    }

    // --- timeUntilNextClaim / canClaim --------------------------------------

    function test_TimeUntilNextClaim_ZeroBeforeFirstClaim() public view {
        assertEq(faucet.timeUntilNextClaim(alice), 0);
    }

    function test_TimeUntilNextClaim_DecreasesToZero() public {
        _claim(alice);

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
        _claim(alice);
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

    function test_SetSigner_OwnerSucceeds() public {
        address newSigner = makeAddr("newSigner");
        vm.expectEmit(true, false, false, false, address(faucet));
        emit SignerUpdated(newSigner);
        faucet.setSigner(newSigner);
        assertEq(faucet.signer(), newSigner);
    }

    function test_SetSigner_RevertsOnZero() public {
        vm.expectRevert(TokenFaucet.ZeroSigner.selector);
        faucet.setSigner(address(0));
    }

    function test_SetSigner_NonOwnerReverts() public {
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        vm.prank(alice);
        faucet.setSigner(alice);
    }

    function test_SetSigner_RotatesAcceptedKey() public {
        uint256 newPk = 0xCAFE;
        faucet.setSigner(vm.addr(newPk));

        uint256 nonce = nextNonce++;
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(newPk, alice, nonce, deadline);
        vm.prank(alice);
        faucet.claim(nonce, deadline, sig);
        assertEq(token.balanceOf(alice), DRIP);
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
        _claim(alice);
        uint256 claimedAt = block.timestamp;

        vm.warp(claimedAt + elapsed);

        uint256 nonce = nextNonce++;
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory sig = _sign(signerPk, alice, nonce, deadline);

        if (elapsed >= COOLDOWN) {
            assertEq(faucet.timeUntilNextClaim(alice), 0);
            vm.prank(alice);
            faucet.claim(nonce, deadline, sig); // should not revert
        } else {
            assertEq(faucet.timeUntilNextClaim(alice), COOLDOWN - elapsed);
            vm.expectRevert(abi.encodeWithSelector(TokenFaucet.CooldownActive.selector, COOLDOWN - elapsed));
            vm.prank(alice);
            faucet.claim(nonce, deadline, sig);
        }
    }
}
