# Testing strategy

| Layer            | Tool                     | What it covers                                        |
| ---------------- | ------------------------ | ----------------------------------------------------- |
| Contracts        | Foundry (`forge test`)   | faucet logic, cooldown, access control, fuzz          |
| Unit / component | Vitest + Testing Library | hooks, formatters, components, states                 |
| Route Handlers   | Vitest + MSW             | param validation, envelope, provider fallback         |
| E2E              | Playwright (mock wallet) | connect → switch → claim → cooldown; portfolio render |

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

cd contracts
forge test -vvv         # verbose
forge coverage          # coverage summary
```

## E2E notes

Wallet automation uses a mock connector (or Synpress) pointed at a local `anvil`
fork so claims are deterministic and free. Keep one happy-path E2E; push edge
cases down to fast unit tests.
