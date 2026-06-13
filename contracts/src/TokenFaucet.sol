// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title TokenFaucet
/// @notice Drips a fixed amount of an ERC-20 to any caller, rate-limited to once
///         per 24h per address. Owner-funded, owner-administered, pausable.
/// @dev Invariant: a given address can successfully `claim()` at most once per
///      COOLDOWN window. Enforced via `lastClaim` + checks-effects-interactions.
contract TokenFaucet is Ownable, Pausable {
    using SafeERC20 for IERC20;

    /// @notice The token this faucet drips.
    IERC20 public immutable token;

    /// @notice Minimum time between successful claims by the same address.
    uint256 public constant COOLDOWN = 24 hours;

    /// @notice Amount sent per successful claim.
    uint256 public dripAmount;

    /// @notice Timestamp of each address's last successful claim.
    mapping(address account => uint256 timestamp) public lastClaim;

    error CooldownActive(uint256 secondsRemaining);
    error FaucetEmpty();
    error InvalidDripAmount();

    event Claimed(address indexed to, uint256 amount, uint256 timestamp);
    event DripAmountUpdated(uint256 newDripAmount);
    event Funded(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    constructor(IERC20 _token, uint256 _dripAmount, address initialOwner) Ownable(initialOwner) {
        if (_dripAmount == 0) revert InvalidDripAmount();
        token = _token;
        dripAmount = _dripAmount;
    }

    /// @notice Claim `dripAmount` tokens. Reverts if the cooldown is active or
    ///         the faucet cannot cover a full drip.
    function claim() external whenNotPaused {
        uint256 remaining = timeUntilNextClaim(msg.sender);
        if (remaining != 0) revert CooldownActive(remaining);
        if (token.balanceOf(address(this)) < dripAmount) revert FaucetEmpty();

        lastClaim[msg.sender] = block.timestamp;
        emit Claimed(msg.sender, dripAmount, block.timestamp);
        token.safeTransfer(msg.sender, dripAmount);
    }

    /// @notice Seconds until `account` may claim again (0 if claimable now).
    function timeUntilNextClaim(address account) public view returns (uint256) {
        uint256 last = lastClaim[account];
        if (last == 0) return 0;
        uint256 unlockAt = last + COOLDOWN;
        if (block.timestamp >= unlockAt) return 0;
        return unlockAt - block.timestamp;
    }

    /// @notice Whether `account` can claim right now (cooldown, funds, pause).
    function canClaim(address account) external view returns (bool) {
        return !paused() && timeUntilNextClaim(account) == 0 && token.balanceOf(address(this)) >= dripAmount;
    }

    /// @notice Pull `amount` MFT from the caller into the faucet. Anyone can fund.
    function fund(uint256 amount) external {
        emit Funded(msg.sender, amount);
        token.safeTransferFrom(msg.sender, address(this), amount);
    }

    function setDripAmount(uint256 newDripAmount) external onlyOwner {
        if (newDripAmount == 0) revert InvalidDripAmount();
        dripAmount = newDripAmount;
        emit DripAmountUpdated(newDripAmount);
    }

    function withdraw(uint256 amount) external onlyOwner {
        emit Withdrawn(msg.sender, amount);
        token.safeTransfer(msg.sender, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
