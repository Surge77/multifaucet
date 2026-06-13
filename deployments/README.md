# Deployments

`addresses.json` is the canonical record of deployed contract addresses per
chain id. It is consumed by the app's chain registry (`src/config/chains.ts`)
and rendered in the root README's supported-chains table.

| Field | Meaning |
| --- | --- |
| key | chain id (e.g. `11155111` = Ethereum Sepolia) |
| `chainName` | slug used by Foundry RPC aliases |
| `token` | deployed `MultiFaucetToken` (MFT) address |
| `faucet` | deployed `TokenFaucet` address |

Addresses are filled in after running `script/Deploy.s.sol` against each testnet
(see [`docs/CONTRACTS.md`](../docs/CONTRACTS.md)). Empty strings mean "not yet
deployed".
