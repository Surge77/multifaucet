# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems. Email
**tejasdeshmane66@gmail.com** with details and steps to reproduce. You'll get an
acknowledgement within 72 hours.

## Design guarantees

MultiFaucet is **non-custodial and key-isolated** by design:

- **No private keys in the app or repo.** Every write (`claim()`) is signed by
  the user's own wallet in the browser. The server never holds funds or keys.
- **Server secrets never reach the client.** Alchemy and CoinGecko keys are used
  only inside Next.js Route Handlers (`src/app/api/**`). The CI build greps the
  emitted client bundle and fails if any secret string appears.
- **Read mode cannot sign.** The paste-an-address portfolio path performs only
  read RPC calls; it can never trigger a transaction.
- **Inputs validated at the boundary.** Addresses are checked with viem
  `isAddress` and query params parsed with zod before any provider call, so user
  input can't be injected into provider URLs.

## Known advisories

- `postcss < 8.5.10` (moderate, GHSA-qx2v-qp2m-jg93) appears transitively inside
  Next.js's own bundled toolchain. The only `npm audit fix` is a downgrade of
  Next.js to v9 — a non-viable breaking change. It affects CSS stringify at
  build time, not the deployed runtime, and is tracked upstream in Next.js.

## Threat model (summary)

| Threat                        | Mitigation                                          |
| ----------------------------- | --------------------------------------------------- |
| API key exfiltration          | Keys server-only; CI bundle grep                    |
| Malicious address input       | viem `isAddress` + zod validation                   |
| Unwanted signing in read mode | Separate read path, no wallet client                |
| Supply-chain (deps)           | Pinned versions, `npm audit`, lockfile committed    |
| Faucet drain / abuse          | On-chain 24h cooldown, owner-only admin, `Pausable` |
