<div align="center">

# 🚰 MultiFaucet

**One wallet. Three testnets to fund. Three mainnets to watch.**

A production-grade Web3 dashboard that drips testnet ERC-20s from a custom
on-chain faucet **and** shows a real, read-only multi-chain portfolio with live
USD values — without ever leaking an API key to the browser.

[Live demo](#) · [Architecture](docs/ARCHITECTURE.md) · [Contracts](docs/CONTRACTS.md) · [Security](docs/SECURITY.md)

</div>

> ⚠️ **Status:** under active construction. Deployed addresses and the live demo
> link land at the end of Phase 2 / deployment. Build order is in
> [`docs/DECISIONS.md`](docs/DECISIONS.md).

---

## Why this exists

Public testnet faucets are flaky, rate-limited, and often gated behind mainnet
balances. And most "portfolio" dApps ask you to connect a wallet just to _read_
public data. MultiFaucet fixes both:

- **Devs** get a custom faucet they control — claim `MFT` on three EVM testnets,
  one click, 24h cooldown enforced on-chain.
- **Anyone** can paste an address and see a clean cross-chain portfolio with USD
  totals — **zero signing, zero custody, zero risk**.

## What makes it more than a tutorial

| Beginner version         | This project                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------- |
| Links to public faucets  | **Custom Solidity faucet** deployed to 3 chains, 100% test coverage                     |
| RPC keys in the frontend | **Server-side proxy** — CI fails the build if a key string appears in the client bundle |
| Testnet-only toy         | **Real mainnet + L2 portfolio** with live CoinGecko USD valuation                       |
| "Connect to view"        | **Paste-any-address** read mode — no wallet needed                                      |

## Numbers (the bar)

- ⏱️ Wallet-connect → first balance render: **< 2s** (warm cache)
- ♿ Lighthouse **Accessibility ≥ 95**, **Performance ≥ 90**
- 🔒 **0** server secrets in the client bundle (asserted in CI)
- 🧪 **100%** line coverage on the faucet contract; **≥ 80%** on app code
- 🔗 **3** testnets fundable · **3** mainnets viewable

## Supported chains

| Chain            | Type    | Mode                | Faucet (`MFT`) |
| ---------------- | ------- | ------------------- | -------------- |
| Ethereum Sepolia | testnet | claim               | `TBD`          |
| Base Sepolia     | testnet | claim               | `TBD`          |
| Arbitrum Sepolia | testnet | claim               | `TBD`          |
| Ethereum         | mainnet | read-only portfolio | —              |
| Base             | mainnet | read-only portfolio | —              |
| Arbitrum One     | mainnet | read-only portfolio | —              |

## Tech stack

**Frontend** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 · shadcn/ui · Recharts
**Web3** wagmi v2 · viem · RainbowKit v2 · TanStack Query
**Contracts** Solidity · Foundry · OpenZeppelin
**Data (server-only)** Alchemy (RPC + Token/Transfers) · CoinGecko (prices)
**Quality** Vitest · Testing Library · Playwright · MSW · ESLint · Prettier · GitHub Actions

## Architecture in one diagram

```
                         ┌──────────────────────────────┐
   user's wallet  ──sign──►   on-chain: claim() write    │  Sepolia / Base / Arbitrum (testnet)
                         └──────────────────────────────┘
  Browser (React + wagmi/viem)
        │  fetch (no keys)
        ▼
  Next.js Route Handlers  ──keys, cache, rate-limit──►  Alchemy · CoinGecko
  (server: /api/portfolio, /api/prices, /api/transfers, /api/health)
```

Reads flow through the server (keys hidden, responses cached). Writes are signed
by the user's wallet and go straight to chain — the server never holds funds or
keys. Full detail in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Local setup

```bash
# 1. Clone + install
git clone https://github.com/Surge77/multifaucet.git
cd multifaucet
npm ci

# 2. Configure env
cp .env.example .env.local   # fill in ALCHEMY_API_KEY + NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

# 3. Run
npm run dev                  # http://localhost:3000
```

Contracts (optional, requires [Foundry](https://book.getfoundry.sh/)):

```bash
cd contracts
forge install
forge test          # run the faucet test suite
forge coverage      # expect 100% on faucet sources
```

## Environment variables

| Var                                                  | Scope     | Required    | Purpose                    |
| ---------------------------------------------------- | --------- | ----------- | -------------------------- |
| `ALCHEMY_API_KEY`                                    | server    | yes         | RPC + balances + transfers |
| `COINGECKO_API_KEY`                                  | server    | optional    | USD prices (free tier ok)  |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`               | client    | yes         | WalletConnect modal        |
| `NEXT_PUBLIC_SENTRY_DSN`                             | client    | optional    | error reporting            |
| `*_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, `*SCAN_API_KEY` | contracts | deploy only | Foundry deploy + verify    |

Only `NEXT_PUBLIC_*` reaches the browser. See [`.env.example`](.env.example).

## Scripts

| Command                                  | Does                             |
| ---------------------------------------- | -------------------------------- |
| `npm run dev`                            | Dev server                       |
| `npm run build`                          | Production build                 |
| `npm run typecheck`                      | `tsc --noEmit` (the type gate)   |
| `npm run lint` / `npm run format`        | ESLint / Prettier                |
| `npm run test` / `npm run test:coverage` | Vitest                           |
| `forge test` / `forge coverage`          | Contract tests (in `contracts/`) |

## How the faucet works

`TokenFaucet` holds a balance of `MFT` and drips a fixed amount per `claim()`,
gated by a per-address 24h cooldown enforced with `block.timestamp`. It's
`Ownable` (fund / set drip / withdraw) and `Pausable`. Reverts use custom errors
(`CooldownActive`, `FaucetEmpty`). Full reference + invariants in
[`docs/CONTRACTS.md`](docs/CONTRACTS.md).

## Roadmap

- [x] Plan + scaffold + tooling
- [ ] Faucet + token contracts (Foundry, 100% coverage) → deploy to 3 testnets
- [ ] Wallet + chain registry + network switching
- [ ] Faucet UI (claim + live cooldown)
- [ ] Server data layer (portfolio / prices / transfers)
- [ ] Portfolio UI (balances, USD, allocation chart, paste-address)
- [ ] Polish, a11y, observability, E2E, deploy

## License

[MIT](LICENSE) © 2026 Tejas Deshmane
