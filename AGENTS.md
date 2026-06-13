<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# MultiFaucet — project rules

Project-local instructions. These OVERRIDE global rules where they conflict.
Full plan lives in `docs/` and `~/.claude/plans/`.

## What this is

Multi-Chain Token Faucet & Portfolio Dashboard. Two modes, one wallet:

- **Faucet (testnet):** claim the `MFT` ERC-20 from our deployed faucet on
  Sepolia / Base Sepolia / Arbitrum Sepolia, 24h per-address cooldown.
- **Portfolio (mainnet + L2, read-only):** native + ERC-20 balances, USD value,
  tx history for the connected or any pasted address.

## Locked stack — do NOT introduce new technologies without asking

- Next.js 16 (App Router) · React 19 · TypeScript (strict).
- Tailwind CSS v4 + shadcn/ui + next-themes.
- wagmi v2 + viem + RainbowKit v2 + TanStack Query.
- Recharts for charts.
- Contracts: Solidity + Foundry + OpenZeppelin.
- Data: Alchemy (RPC + APIs) + CoinGecko — **server-side Route Handlers only**.
- Tests: Vitest + Testing Library, Playwright (E2E), Foundry (contracts), MSW.

## Hard rules (project)

- **File size limit: 300 lines.** Split by responsibility before exceeding.
- **No server secrets in the client.** Alchemy/CoinGecko keys live in Route
  Handlers (`src/app/api/**`). Anything in the browser uses `NEXT_PUBLIC_*` only.
  CI greps the built bundle to enforce this — do not defeat it.
- **No private keys anywhere in the repo.** Writes are signed by the user's
  wallet client-side. The deployer key is local `.env` / GitHub Secrets only.
- TS strict, no `any` (use `unknown` + narrow). Named exports. `const` only.
- Functional components; hooks prefixed `use`. Validate inputs at boundaries
  (Route Handlers via zod; addresses via viem `isAddress`).
- Batch on-chain reads with viem `multicall` — never loop one RPC call per token.
- Conventional Commits. Feature branch → PR (never commit feature work to `main`).
- Coverage: ≥80% app, **100% on the faucet contract** and validation logic.

## Single source of truth

The **chain registry** (`src/config/chains.ts`) defines every supported chain:
id, type (testnet|mainnet), explorer, faucet address, tracked tokens. Both the
wagmi config and the server handlers consume it. Add a chain there, nowhere else.

## Commands

- `npm run dev` · `npm run build`
- `npm run typecheck` (run after EVERY change — the type gate)
- `npm run lint` · `npm run format`
- `npm run test` · `npm run test:coverage`
- Contracts (in `contracts/`): `forge build` · `forge test` · `forge coverage`

## Out of scope (v1) — do not build without asking

Solana / non-EVM · swaps/sends/approvals · NFTs · staking · P/L history ·
backend DB or user accounts. App is stateless (wagmi + localStorage).
