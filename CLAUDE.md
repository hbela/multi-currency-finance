# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Project

Multi-currency personal finance app for digital nomads — React Native + Expo (SDK 54), Expo Router, SQLite, React Native Paper, Zustand, `@tanstack/react-query`. TypeScript strict mode. See [docs/PRD.md](docs/PRD.md) for the product blueprint.

## Commands

- `npm start` — Expo dev server
- `npm run android` / `npm run ios` / `npm run web`
- `npm run lint` — `expo lint` (ESLint 9 + `eslint-config-expo`)

No test runner is configured. Do not claim tests pass unless one is added.

## Architecture

### Routing
Expo Router file-based. Tabs in [app/(tabs)/](app/(tabs)/); modal transaction screens in [app/transaction/](app/transaction/). Root provider stack in [app/_layout.tsx](app/_layout.tsx) wires `SafeAreaProvider` → `PaperProvider` → navigation `ThemeProvider`.

Current tabs (in order): Dashboard · Transactions · **Accounts** · Budgets · Reports · Settings · Support.

### Data layer
Synchronous `expo-sqlite` opened once in [src/db/db.ts](src/db/db.ts). Schema/migrations in [src/db/migrations.ts](src/db/migrations.ts) — currently **`SCHEMA_VERSION = 7`**. Seed data in [src/db/seed.ts](src/db/seed.ts).

Per-entity DB modules:
| Module | Entities |
|---|---|
| [src/db/accounts.ts](src/db/accounts.ts) | accounts |
| [src/db/categories.ts](src/db/categories.ts) | categories |
| [src/db/transactions.ts](src/db/transactions.ts) | transactions |
| [src/db/budgets.ts](src/db/budgets.ts) | budgets |
| [src/db/currencies.ts](src/db/currencies.ts) | currencies (20 fiat + 3 crypto, seeded in v7) |
| [src/db/exchangeRates.ts](src/db/exchangeRates.ts) | exchange_rates |
| [src/db/ledger.ts](src/db/ledger.ts) | ledger_entries |

Migrations + seed run once from `RootLayout` before stores hydrate.

### Ledger & balances
Every transaction creates `ledger_entries` rows (positive = money in, negative = money out). **Account balances are derived from the ledger** via `getLedgerBalanceForAccount(accountId)` in [src/db/ledger.ts](src/db/ledger.ts) — this is always authoritative. The `balance` column on `accounts` is a denormalized cache updated atomically by `createTransactionWithBalanceUpdate`.

### Multi-currency / FX
[src/services/fx.service.ts](src/services/fx.service.ts) handles all currency conversion:
- `convertAmount(amount, from, to)` — tries direct pair → inverse → triangulate via base currency
- `computeNetWorthInBase(accounts)` — sums ledger balances for all accounts, converts each to the base currency
- `buildRateMap()` / `convertWithMap()` — sync batch conversion for hot render paths

One currency has `isBase = 1` in the `currencies` table. Managed via `useCurrencyStore`. Net worth on the Dashboard always displays in the base currency.

### Transfers (TRANSFER type)
Transfers use **three fields** beyond the normal transaction fields:
- `fromAccountId` — source account (also written to `accountId` for back-compat)
- `toAccountId` — destination account
- `receivedAmount` — amount credited to the destination (may differ from `amount` for FX transfers)

`createTransactionWithBalanceUpdate` debits `amount` from `fromAccountId` and credits `receivedAmount` to `toAccountId`. Always supply `receivedAmount` even for same-currency transfers (set it equal to `amount`).

### State
Zustand stores in [src/store/](src/store/) mirror DB tables. Each store exposes `load()` that reads from the db module; mutations write through the db module then refresh store state. Components read from stores, not directly from the db.

Stores loaded in `RootLayout` `Promise.all`:
- `useAccountStore` · `useCategoryStore` · `useTransactionStore` · `useBudgetStore`
- `useThemeStore` · `useCurrencyStore` · `useExchangeRateStore`

If you add a new store, add it to that `Promise.all` or the splash will never dismiss.

### Server state
`@tanstack/react-query` handles all async DB reads. Query hooks live in [src/hooks/useQueries.ts](src/hooks/useQueries.ts). Raw numbers are cached; formatting is presentation-only and never stored in the cache.

### Localisation
`react-i18next` for UI strings; language persisted via `getSetting('app_language')` in SQLite. [src/store/localeStore.ts](src/store/localeStore.ts) (Zustand) derives `lang / locale / currency` from i18next and auto-updates on `languageChanged` — it is the single source of truth for formatting.

Supported locales: `en`, `hu`, `de`, `fr`. When adding new i18n keys, update **all four** locale files plus the `Translations` type in [src/i18n/locales/en.ts](src/i18n/locales/en.ts).

### Money formatting
Always use [src/hooks/useFormattedAmount.ts](src/hooks/useFormattedAmount.ts):
- `useFormattedAmount(amount, currency)` — single value in a component
- `useMoneyFormatter(currency)` — returns a formatter function when formatting multiple values

The pure function `formatMoney(amount, lang, currency)` in [src/utils/format.ts](src/utils/format.ts) is for use outside React. Never call `formatCurrency` in render without subscribing to `useLocaleStore`.

### Shared code
Reusable UI in [src/components/](src/components/), types in [src/types/index.ts](src/types/index.ts), helpers in [src/utils/](src/utils/) (`format`, `date`, `id` via nanoid).

### Path alias
`@/*` maps to the repo root (see [tsconfig.json](tsconfig.json)). Import as `@/src/store/...`, `@/src/db/...`.

## Conventions

- TS strict — no `any` without a reason. Prefer types from [src/types/index.ts](src/types/index.ts).
- UI is React Native Paper (MD3). Theme flips on `useColorScheme`; don't hardcode colors — use `theme.colors`.
- IDs are string (nanoid), timestamps are `INTEGER` epoch ms. Money amounts are stored as `TEXT` strings (not `REAL`) to avoid float drift.
- When adding a table or column, add a new version block in [src/db/migrations.ts](src/db/migrations.ts) and bump `SCHEMA_VERSION`. Never edit past migration blocks.
- Keep db access inside `src/db/*`; keep React/Paper code out of db modules.
- Keep FX logic inside `src/services/fx.service.ts`; components call the service, not `exchangeRates.ts` directly.

## Gotchas

- `expo-sqlite` uses the **sync** API (`openDatabaseSync`, `runSync`, `getAllSync`). Don't use the old callback-style `db.transaction(tx => ...)` API.
- **Hermes / Android `Intl`** — do not use `Intl.NumberFormat` for money. Hermes has incomplete `Intl` support on Android. Use `formatMoney` / `useMoneyFormatter` instead.
- **Locale store is not persisted** — `useLocaleStore` derives from i18next on every cold start. The persisted value is the i18next language key in SQLite (`getSetting('app_language')`), restored in `RootLayout` before stores hydrate.
- **Currency list in TransactionForm** — the `CURRENCIES` constant at the top of [src/components/TransactionForm.tsx](src/components/TransactionForm.tsx) controls the currency dropdown in the transaction form. The full currency list for account creation comes from `useCurrencyStore` (live from DB).
- **Account balance vs ledger balance** — `account.balance` (cached) can drift if you manipulate the DB directly. Always use `getLedgerBalanceForAccount(id)` for display in the Accounts screen. The cached `balance` is kept in sync only through `createTransactionWithBalanceUpdate`.
- Shell is bash-on-Windows — use forward slashes and `/dev/null`, not `NUL`.
