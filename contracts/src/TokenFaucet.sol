// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title TokenFaucet
/// @notice Drips a fixed amount of an ERC-20, gated by a single-use EIP-712
///         voucher signed off-chain by a trusted `signer` (issued only after a
///         captcha check), and rate-limited to once per 24h per address.
/// @dev Sybil-resistance is layered: the off-chain signer gates *who* gets a
///      voucher (proof-of-humanity), single-use nonces stop voucher replay, and
///      the per-address cooldown caps frequency. Vouchers bind to `msg.sender`,
///      so a leaked voucher cannot be redeemed by anyone else.
contract TokenFaucet is Ownable, Pausable, EIP712 {
    using SafeERC20 for IERC20;

    /// @notice The token this faucet drips.
    IERC20 public immutable token;

    /// @notice Minimum time between successful claims by the same address.
    uint256 public constant COOLDOWN = 24 hours;

    /// @notice Amount sent per successful claim.
    uint256 public dripAmount;

    /// @notice Address whose signature authorizes a claim voucher.
    address public signer;

    /// @notice Timestamp of each address's last successful claim.
    mapping(address account => uint256 timestamp) public lastClaim;

    /// @notice Whether a voucher nonce has already been redeemed.
    mapping(uint256 nonce => bool used) public nonceUsed;

    bytes32 private constant CLAIM_TYPEHASH =
        keccak256("Claim(address recipient,uint256 nonce,uint256 deadline)");

    error CooldownActive(uint256 secondsRemaining);
    error FaucetEmpty();
    error InvalidDripAmount();
    error ZeroSigner();
    error InvalidSignature();
    error VoucherExpired();
    error NonceAlreadyUsed();

    event Claimed(address indexed to, uint256 amount, uint256 timestamp);
    event DripAmountUpdated(uint256 newDripAmount);
    event SignerUpdated(address indexed newSigner);
    event Funded(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    constructor(IERC20 _token, uint256 _dripAmount, address _signer, address initialOwner)
        Ownable(initialOwner)
        EIP712("TokenFaucet", "1")
    {
        if (_dripAmount == 0) revert InvalidDripAmount();
        if (_signer == address(0)) revert ZeroSigner();
        token = _token;
        dripAmount = _dripAmount;
        signer = _signer;
    }

    /// @notice Claim `dripAmount` tokens by redeeming a signer-issued voucher.
    /// @param nonce Unique voucher id; each may be redeemed once.
    /// @param deadline Unix time after which the voucher is invalid.
    /// @param signature EIP-712 signature over (msg.sender, nonce, deadline).
    function claim(uint256 nonce, uint256 deadline, bytes calldata signature) external whenNotPaused {
        if (block.timestamp > deadline) revert VoucherExpired();
        if (nonceUsed[nonce]) revert NonceAlreadyUsed();
        if (ECDSA.recover(_claimDigest(msg.sender, nonce, deadline), signature) != signer) {
            revert InvalidSignature();
        }

        uint256 remaining = timeUntilNextClaim(msg.sender);
        if (remaining != 0) revert CooldownActive(remaining);
        if (token.balanceOf(address(this)) < dripAmount) revert FaucetEmpty();

        nonceUsed[nonce] = true;
        lastClaim[msg.sender] = block.timestamp;
        emit Claimed(msg.sender, dripAmount, block.timestamp);
        token.safeTransfer(msg.sender, dripAmount);
    }

    /// @notice EIP-712 digest a `signer` must sign to authorize `recipient`'s
    ///         claim. Exposed so the off-chain signer and tests share one source.
    function claimDigest(address recipient, uint256 nonce, uint256 deadline)
        external
        view
        returns (bytes32)
    {
        return _claimDigest(recipient, nonce, deadline);
    }

    function _claimDigest(address recipient, uint256 nonce, uint256 deadline)
        private
        view
        returns (bytes32)
    {
        return _hashTypedDataV4(keccak256(abi.encode(CLAIM_TYPEHASH, recipient, nonce, deadline)));
    }

    /// @notice Seconds until `account` may claim again (0 if claimable now).
    function timeUntilNextClaim(address account) public view returns (uint256) {
        uint256 last = lastClaim[account];
        if (last == 0) return 0;
        uint256 unlockAt = last + COOLDOWN;
        if (block.timestamp >= unlockAt) return 0;
        return unlockAt - block.timestamp;
    }

    /// @notice Whether `account` clears the on-chain gates (cooldown, funds,
    ///         pause). A valid voucher is still required to `claim()`.
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

    function setSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert ZeroSigner();
        signer = newSigner;
        emit SignerUpdated(newSigner);
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
