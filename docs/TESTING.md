# Testing strategy

| Layer            | Tool                      | What it covers                                     |
| ---------------- | ------------------------- | -------------------------------------------------- |
| Contracts        | Foundry (`forge test`)    | faucet logic, cooldown, access control, fuzz       |
| Unit / component | Vitest + Testing Library  | hooks, formatters, components, states              |
| Route Handlers   | Vitest + MSW              | param validation, envelope, provider fallback      |
| E2E              | Playwright (stubbed APIs) | hero + tabs render, theme toggle, portfolio totals |

## Principles

- **Test behavior, not implementation.** Names describe the behavior:
  `rejects a second claim within the cooldown window`.
- **AAA structure** — Arrange, Act, Assert.
- **Isolation** — no shared mutable state; `cleanup()` after each component test;
  Foundry tests are independent by construction.
- **No real network in unit tests** — MSW stubs HTTP; `anvil` fork for contract
  integration and E2E.
- Test path mirrors source: `src/lib/format.ts` → `src/lib/format.test.ts`.

## Coverage gates

- App: **≥ 80%** lines/branches/functions/statements (`vitest --coverage`,
  enforced in `vitest.config.ts`).
- Faucet contract: **100%** lines (`forge coverage`).
- 100% also required on validation logic (address/param parsing).

## Commands

```bash
npm run test            # run once
npm run test:watch      # watch mode
npm run test:coverage   # with thresholds
npm run test:e2e        # Playwright (builds + serves the app)

cd contracts
forge test -vvv         # verbose
forge coverage          # coverage summary
```

## E2E notes

`npm run test:e2e` builds the production app, serves it, and runs the suite in
`e2e/`. Provider APIs and on-chain reads are stubbed per-test with Playwright
`page.route`, so the suite is deterministic and needs no live keys, funded
wallet, or deployed contracts. The happy path covers the hero/tab render, the
theme toggle, and portfolio totals for a pasted address.

The wallet-connected claim → cooldown flow is intentionally left to manual
verification on a Vercel preview: it requires the faucet deployed to the three
testnets plus wallet automation (mock connector / Synpress against `anvil`).
Push edge cases down to the fast unit and contract tests.
