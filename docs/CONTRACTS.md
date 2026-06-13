# Contracts

Foundry project under [`contracts/`](../contracts). Two contracts, both built on
audited OpenZeppelin primitives.

## `MultiFaucetToken` (MFT)

A standard OpenZeppelin `ERC20` with `Ownable` mint. The owner mints the supply
that funds the faucet. 18 decimals, symbol `MFT`.

## `TokenFaucet`

Holds a balance of `MFT` and drips a fixed amount per claim, rate-limited per
address.

### State

- `IERC20 public immutable token`
- `uint256 public dripAmount`
- `uint256 public constant COOLDOWN = 24 hours`
- `mapping(address => uint256) public lastClaim`

### Core invariant

> A given address can successfully `claim()` at most once per `COOLDOWN` window.

Enforced by: `if (block.timestamp < lastClaim[msg.sender] + COOLDOWN) revert CooldownActive(...)`.
On success, `lastClaim[msg.sender] = block.timestamp` **before** the transfer
(checks-effects-interactions).

### Functions

| Function                      | Access | Notes                                                     |
| ----------------------------- | ------ | --------------------------------------------------------- |
| `claim()`                     | public | reverts `CooldownActive` / `FaucetEmpty`; emits `Claimed` |
| `fund(uint256)`               | owner  | pulls MFT into the faucet                                 |
| `setDripAmount(uint256)`      | owner  | adjust drip                                               |
| `withdraw(uint256)`           | owner  | recover MFT                                               |
| `pause()` / `unpause()`       | owner  | `Pausable`; `claim` blocked while paused                  |
| `timeUntilNextClaim(address)` | view   | seconds remaining (0 if claimable)                        |

### Errors & events

- `error CooldownActive(uint256 secondsRemaining)`
- `error FaucetEmpty()`
- `event Claimed(address indexed to, uint256 amount, uint256 timestamp)`

## Test matrix (target: 100% lines)

| Case                        | Expectation                                               |
| --------------------------- | --------------------------------------------------------- |
| First claim                 | transfers `dripAmount`, sets `lastClaim`, emits `Claimed` |
| Second claim within 24h     | reverts `CooldownActive`                                  |
| Claim after `vm.warp(+24h)` | succeeds again                                            |
| Faucet underfunded          | reverts `FaucetEmpty`                                     |
| `claim` while paused        | reverts (`Pausable`)                                      |
| Non-owner calls admin fn    | reverts `OwnableUnauthorizedAccount`                      |
| `timeUntilNextClaim`        | monotonically decreases, hits 0                           |
| Fuzz: random warp           | claimable iff elapsed ≥ COOLDOWN                          |

## Deploy + verify

```bash
cd contracts
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
```

Repeat for Base Sepolia and Arbitrum Sepolia with their RPC + scan keys. Deployed
addresses are written to [`deployments/`](../deployments) and copied into the
chain registry (`src/config/chains.ts`) and the README table.

> Use a **throwaway deployer key** funded with testnet ETH only. Never a real
> wallet.
