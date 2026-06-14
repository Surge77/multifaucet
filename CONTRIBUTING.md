# Contributing to MultiFaucet

Thanks for your interest! This project doubles as a portfolio piece, so it holds
itself to production standards. PRs are welcome if they respect the scope and
the gates below.

## Ground rules

- **Stay in scope.** v1 is an EVM testnet faucet + read-only mainnet portfolio.
  Out of scope: Solana, swaps/sends, NFTs, staking, accounts/DB. Open an issue
  before building anything new.
- **300-line file limit.** Split by responsibility before exceeding it.
- **No `any`.** Use `unknown` and narrow, or define a type.
- **No server secrets in client code.** Data providers are called only from
  `src/app/api/**`.

## Workflow

1. Branch from `main`: `feature/<short-desc>` or `fix/<short-desc>`.
2. Write the test first where practical (Vitest for app, `forge test` for
   contracts). Coverage: ≥80% app, 100% on the faucet contract.
3. Keep commits [Conventional](https://www.conventionalcommits.org):
   `feat(faucet): add cooldown countdown`.
4. Open a PR using the template. The pre-commit hook runs lint-staged; CI runs
   format, lint, typecheck, tests, build, the secret-leak check, and `forge test`.

## Local checks before pushing

```bash
npm run format
npm run lint
npm run typecheck
npm run test:coverage
# if you touched contracts:
cd contracts && forge test && forge coverage
```

All green → open the PR. Reviews look for correctness and the gates above.
