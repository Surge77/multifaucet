// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MultiFaucetToken
/// @notice ERC-20 test token (MFT) minted by the owner to fund the faucet.
contract MultiFaucetToken is ERC20, Ownable {
    constructor(address initialOwner) ERC20("MultiFaucet Token", "MFT") Ownable(initialOwner) {}

    /// @notice Mint new MFT. Owner-only; used to seed the faucet on testnets.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
