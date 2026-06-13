# Architecture Decision Records

Short, dated records of the choices that shaped MultiFaucet.

---

## ADR-001 — Next.js App Router with server-side data proxy

**Date:** 2026-06-13 · **Status:** accepted

**Context.** The dashboard reads balances, prices, and transfers from Alchemy and
CoinGecko. A pure SPA would expose those API keys in the browser.

**Decision.** Use Next.js (App Router) and route every provider read through
server **Route Handlers** (`src/app/api/**`). Keys stay server-side; responses
are cached.

**Consequences.** One framework for UI + serverless API; deploys cleanly to
Vercel; CI can grep the client bundle to prove no key leaked. Slight added
indirection vs direct RPC, paid back in security and rate-limit control.

---

## ADR-002 — EVM-only multi-chain (no Solana) for v1

**Date:** 2026-06-13 · **Status:** accepted

**Context.** The source brief mentioned "Ethereum or Solana." Supporting both
means two wallet stacks (wagmi vs wallet-adapter) and two contract languages
(Solidity vs Rust/Anchor).

**Decision.** Ship EVM-only: Sepolia, Base Sepolia, Arbitrum Sepolia (testnet)
and their mainnets (read-only). One wallet stack, one contract language.

**Consequences.** Cohesive, finishable, still genuinely multi-chain (network
switching + L2s). Solana is explicitly deferred, documented as out-of-scope.

---

## ADR-003 — Custom deployed faucet contract, not public-faucet links

**Date:** 2026-06-13 · **Status:** accepted

**Context.** The beginner framing was "link to existing faucets." That teaches
little and shows no contract skill.

**Decision.** Write and deploy `MultiFaucetToken` + `TokenFaucet` (OpenZeppelin
ERC20 + Ownable + Pausable) with an on-chain 24h cooldown and a 100%-covered
Foundry test suite.

**Consequences.** This is the resume-worthy core: a real write transaction
against a contract we authored and deployed to three chains.

---

## ADR-004 — Foundry over Hardhat

**Date:** 2026-06-13 · **Status:** accepted

**Context.** Need a contract toolchain for build/test/deploy/coverage.

**Decision.** Foundry (forge/anvil/cast).

**Consequences.** Fast Solidity-native tests, built-in fuzzing (`vm.warp` for
cooldown timing), first-class coverage, and `anvil` forks for E2E. No JS/TS
contract test layer to maintain.

---

## ADR-005 — Alchemy as primary data provider

**Date:** 2026-06-13 · **Status:** accepted

**Context.** Need RPC plus token-balance and transfer-history APIs across
Ethereum, Base, and Arbitrum.

**Decision.** Alchemy for RPC + Token/Transfers APIs, with public RPC as a
fallback transport; CoinGecko (free tier) for USD prices. Both called only
server-side and cached.

**Consequences.** One provider covers all six networks with consistent APIs.
Free-tier limits handled by caching and graceful price-unavailable degradation.
