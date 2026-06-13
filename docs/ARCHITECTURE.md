# Architecture

## Overview

MultiFaucet is a stateless Next.js app (no database, no user accounts) plus a set
of Foundry-deployed contracts. It has two read/write paths that are deliberately
kept separate.

```
                          WRITE PATH (testnet)
  Browser ──(user signs in wallet)──► wagmi/viem ──► TokenFaucet.claim()
                                                      on Sepolia/Base/Arbitrum

                          READ PATH (mainnet + testnet)
  Browser ──fetch (no keys)──► Next Route Handlers ──keys+cache──► Alchemy
                                       │                           CoinGecko
                                       └── envelope { success, data, timestamp }
```

## Why a server proxy for reads

A naïve web3 frontend puts the Alchemy key in `NEXT_PUBLIC_*` and calls the RPC
directly from the browser. That key is then public, rate-limited by every
visitor, and trivially scraped. Instead:

- All balance / price / transfer reads go to **Route Handlers** under
  `src/app/api/**`, which hold the keys server-side.
- Responses are **cached** (prices ~60s; balances short TTL) to stay under
  provider free-tier limits and to hit the <2s render target.
- The client only ever sees the sanitized JSON envelope.

Writes don't need the proxy: the user's wallet signs and submits them directly,
so there's no key to hide and no server custody.

## Single source of truth: the chain registry

`src/config/chains.ts` is the only place a chain is defined. Each entry carries:
`id`, `name`, `type` (`testnet | mainnet`), `explorerUrl`, `nativeSymbol`,
`faucetAddress?`, and `trackedTokens[]`. Both consumers read from it:

- **wagmi config** builds its `chains` + `transports` from the registry.
- **Route Handlers** map `chainId` → provider network + tracked tokens from it.

Adding a chain or a tracked token is a one-file change.

## Layers

| Layer       | Location         | Responsibility                                          |
| ----------- | ---------------- | ------------------------------------------------------- |
| Config      | `src/config`     | chain registry, ABIs, tracked tokens                    |
| Types       | `src/types`      | shared domain types                                     |
| Server libs | `src/lib/server` | Alchemy + CoinGecko clients, cache                      |
| Client libs | `src/lib`        | formatting, validation, wagmi setup                     |
| Hooks       | `src/hooks`      | `useFaucet`, `useCooldown`, `usePortfolio`, `usePrices` |
| Components  | `src/components` | `faucet/`, `portfolio/`, `wallet/`, `ui/`               |
| Routes      | `src/app`        | pages + `api/` handlers                                 |
| Contracts   | `contracts`      | Foundry sources, tests, deploy scripts                  |

## Data flow: portfolio render

1. User connects wallet (or pastes an address).
2. Address validated with viem `isAddress` (client) and again with zod (server).
3. `usePortfolio` calls `/api/portfolio?address=&chainId=` per selected chain.
4. Handler batches token balances via viem `multicall`, fetches prices via
   `/api/prices`, returns a `ChainPortfolio` envelope.
5. UI aggregates per-chain results into a total and renders table + donut.

## Performance notes

- `multicall` collapses N token reads into one RPC round-trip.
- Charts and the WalletConnect modal are code-split.
- Address input is debounced 300ms before triggering reads.
