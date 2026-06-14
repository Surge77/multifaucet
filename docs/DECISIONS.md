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

---

## ADR-006 — Server hardening: rate limit, shared cache, price fallback

**Date:** 2026-06-14 · **Status:** accepted

**Context.** The public Route Handlers were unmetered and proxied straight to
Alchemy/CoinGecko; the price cache was per-instance (`TtlCache`), so serverless
cold starts caused upstream stampedes; the transfer scan started at genesis; the
client fetched one portfolio request per chain; failures were swallowed silently.

**Decision.** (1) Per-IP fixed-window rate limit on every handler. (2) Replace
the in-memory cache with the Next.js Data Cache (`next.revalidate`), shared
across instances on Vercel. (3) Bound transfer scans to ~30 days of blocks.
(4) Aggregate all mainnets in one `/api/portfolio` request. (5) Add Alchemy
Prices as a CoinGecko fallback, reusing the existing key. (6) Structured server
logging in place of silent `catch {}`.

**Consequences.** Caching, price fallback, bounded scans, and logging add no new
dependencies. Rate limiting gained a distributed backend in ADR-008.

---

## ADR-008 — Distributed rate limiting via Upstash Redis

**Date:** 2026-06-14 · **Status:** accepted

**Context.** The ADR-006 in-memory limiter counts requests per serverless
instance, so a caller hitting different instances gets N× the intended budget.

**Decision.** Add `@upstash/ratelimit` + `@upstash/redis` (REST, pinned). When
`UPSTASH_REDIS_REST_URL/TOKEN` are set, limits are a global sliding window shared
across instances; otherwise — and on any Redis error — it fails open to the
in-memory limiter, so local dev, tests, and Redis outages still work.

**Consequences.** First external runtime dependency, but optional: the app runs
without it. Keys are server-only (never `NEXT_PUBLIC_`); the REST token is full
read/write to that database, so it stays in env/secrets and out of git.

---

## ADR-007 — Faucet sybil-resistance deferred

**Date:** 2026-06-14 · **Status:** deferred

**Context.** `TokenFaucet` keys its 24h cooldown per address, so a new address
yields a fresh claim. This is the intended v1 design for a testnet faucet.

**Decision.** Defer on-chain sybil mitigation (allowlist / Merkle / signature or
captcha gating). It requires a contract change + redeploy to all three testnets
and re-establishing 100% coverage; the claim path is signed client-side directly
to the contract, so there is no API layer to gate cheaply.

**Consequences.** Faucet remains trivially farmable by spinning up addresses —
acceptable for testnet tokens. Revisit if abuse drains funded balances.
