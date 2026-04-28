
# Implementation Plan

Multi-currency personal finance app — week-by-week build plan.

**Stack:** React Native · Expo SDK 54 · Expo Router · SQLite (sync API) · React Native Paper (MD3) · Zustand · TanStack Query · react-i18next · Zod  
**Locales:** en · hu · de · fr  
**DB schema version:** 7 (as of Week 2)

---

## Week 1 — Data Foundation ✅

Goal: schema, types, stores, and services that all future UI depends on.

### DB / Migrations (v7)
- New tables: `currencies`, `exchange_rates`, `assets`, `holdings`, `loans`, `loan_payments`, `ledger_entries`
- Column additions on `transactions`: `fromAccountId`, `toAccountId`, `receivedAmount`, `country`, `city`
- Column additions on `accounts`: `institution`
- Seeded 20 fiat currencies + BTC/ETH/USDT; seeded EUR→HUF, USD→HUF, GBP→HUF rates
- Files: [src/db/migrations.ts](../src/db/migrations.ts), [src/db/db.ts](../src/db/db.ts)

### DB modules
- [src/db/currencies.ts](../src/db/currencies.ts) — `listCurrencies`, `getCurrency`, `getBaseCurrency`, `upsertCurrency`, `setBaseCurrency`
- [src/db/exchangeRates.ts](../src/db/exchangeRates.ts) — `getRate`, `upsertRate`, `listRates`, `getLatestRates`, `deleteRate`
- [src/db/ledger.ts](../src/db/ledger.ts) — `insertLedgerEntries`, `getLedgerBalanceForAccount`, `getLedgerEntriesForTransaction`, `deleteLedgerEntriesForTransaction`

### FX service
- [src/services/fx.service.ts](../src/services/fx.service.ts)
- `convertAmount(amount, from, to)` — direct pair → inverse → triangulate via base
- `toBaseCurrency(amount, from)` — convenience wrapper
- `computeNetWorthInBase(accounts)` — sums ledger balances, converts each to base currency
- `buildRateMap()` / `convertWithMap()` — sync batch conversion for hot paths

### Zustand stores
- [src/store/currencyStore.ts](../src/store/currencyStore.ts) — `items`, `base`, `load`, `upsert`, `setBase`, `getByCode`
- [src/store/exchangeRateStore.ts](../src/store/exchangeRateStore.ts) — `items`, `load`, `upsertRate`, `deleteRate`, `getRate`

### Types
- Added to [src/types/index.ts](../src/types/index.ts): `Currency`, `ExchangeRate`, `Asset`, `Holding`, `HoldingWithAsset`, `Loan`, `LoanPayment`, `LedgerEntry`, `AssetClass`, `LoanType`
- Extended `Transaction` with v7 fields: `fromAccountId`, `toAccountId`, `receivedAmount`, `country`, `city`

### RootLayout wiring
- `useCurrencyStore.load()` and `useExchangeRateStore.load()` added to the `Promise.all` in [app/_layout.tsx](../app/_layout.tsx)

---

## Week 2 — UI Layer ✅

Goal: screens and form changes that expose the Week 1 data layer to users.

### Accounts tab
- [app/(tabs)/accounts.tsx](../app/(tabs)/accounts.tsx) — FlatList grouped by currency; live ledger-derived balance per row; FAB opens AccountFormSheet for add, row tap opens for edit
- [src/components/AccountFormSheet.tsx](../src/components/AccountFormSheet.tsx) — Dialog: name, scrollable type selector (cash / bank / card / investment / crypto / loan), currency dropdown (from live `currencies` table), institution, notes; two-tap deactivate
- Tab added between Transactions and Budgets (icon: `bank`)

### Transfer form
- `TransactionForm` TRANSFER type now shows a "Transfer details" card with:
  - From account picker (auto-sets `currency` field on the form)
  - To account picker (auto-sets `toCurrency` field)
  - Received amount input labelled with the destination currency
- `CreateTransactionInput` extended with `fromAccountId`, `toAccountId`, `receivedAmount`, `country`, `city`
- `createTransactionWithBalanceUpdate` debits `amount` from `fromAccountId`, credits `receivedAmount` to `toAccountId`; `accountId` = `fromAccountId` for back-compat
- Files: [src/db/transactions.ts](../src/db/transactions.ts), [src/components/TransactionForm.tsx](../src/components/TransactionForm.tsx)

### AccountPicker
- [src/components/AccountPicker.tsx](../src/components/AccountPicker.tsx) — added optional `label` prop; button now shows `name · currency` when an account is selected; checkmark on selected item

### Dashboard net worth
- [app/(tabs)/index.tsx](../app/(tabs)/index.tsx) — net worth computed via `computeNetWorthInBase` (FX-aware, ledger-derived) instead of naive `account.balance` sum; displayed in the base currency

### Exchange rates in Settings
- [app/(tabs)/settings.tsx](../app/(tabs)/settings.tsx) — new Exchange Rates section: list all rates (pair · value · date), delete per row, Add Rate dialog (from / to / rate)

### i18n
- New keys in all 4 locales (en / hu / de / fr):
  - `accounts.*` — screen strings, form labels, errors
  - `exchangeRates.*` — section and form strings
  - `nav.accounts`
  - `txn.fields.fromAccount`, `txn.fields.toAccount`, `txn.fields.receivedAmount`
  - `txn.sections.transfer`
- Files: [src/i18n/locales/en.ts](../src/i18n/locales/en.ts) (type + values), hu.ts, de.ts, fr.ts

---

## Week 3 — Investments tab

Goal: track asset holdings and show unrealised P&L.

### DB modules to add
- `src/db/assets.ts` — `listAssets`, `createAsset`, `updateAsset`, `deleteAsset`
- `src/db/holdings.ts` — `listHoldings`, `listHoldingsWithAsset`, `createHolding`, `updateHolding`, `deleteHolding`

### Zustand stores to add
- `src/store/assetStore.ts`
- `src/store/holdingStore.ts`
- Add both `.load()` calls to `RootLayout` `Promise.all`

### Screen
- `app/(tabs)/investments.tsx` — list holdings grouped by asset class (stock / etf / crypto / bond / other); show quantity, avg cost, current value (manual price input or last known price), unrealised P&L
- `src/components/HoldingFormSheet.tsx` — add/edit holding: select asset (or create inline), account, quantity, avg buy price

### Transaction form integration
- INVESTMENT_BUY / INVESTMENT_SELL types should write a holding update alongside the transaction

### Tab
- Add Investments tab after Accounts (icon: `chart-line`)

---

## Week 4 — Loans tab

Goal: track active loans, amortisation schedule, payment history.

### DB modules to add
- `src/db/loans.ts` — `listLoans`, `createLoan`, `updateLoan`, `closeLoan`
- `src/db/loanPayments.ts` — `listPaymentsForLoan`, `createPayment`

### Zustand stores to add
- `src/store/loanStore.ts`
- Add `.load()` to `RootLayout` `Promise.all`

### Screen
- `app/(tabs)/loans.tsx` — list active loans; per-loan: principal, interest rate, term, remaining balance, next payment
- `src/components/LoanFormSheet.tsx` — create/edit loan: name, principal, currency, interest rate, term months, lender, loan type
- `src/components/LoanPaymentSheet.tsx` — record a payment: principal paid, interest paid (auto-split from amortisation formula), link to a LOAN_REPAYMENT transaction

### Tab
- Add Loans tab after Investments (icon: `handshake`)

---

## Week 5 — Enhanced Dashboard & Reports

Goal: make the dashboard and reports reflect the full multi-currency, multi-account picture.

### Dashboard upgrades
- Account balance summary cards (one per currency group, tappable → Accounts tab filtered)
- Net worth trend sparkline (last 30 days, derived from daily ledger snapshots or recomputed on demand)
- Quick stats: monthly savings rate, biggest expense category

### Reports upgrades
- Add currency filter to monthly breakdown
- Per-account P&L report
- Country/city spending breakdown (using `country`/`city` on transactions)
- Export: extend CSV export to include all v7 fields

---

## Week 6 — Base currency settings & FX rate management

Goal: let the user configure base currency and manage FX rates properly.

### Base currency screen
- Settings → Base currency: show current base, allow switching; recalculates net worth immediately
- Warn that historical `amountBase` values stored on old transactions will not be retroactively recalculated

### FX rate management
- Move Exchange Rates out of Settings into a dedicated modal/screen
- Add date picker to rate entry (default today)
- Show rate history per pair (list of dated entries)
- Show "last updated" timestamp on Dashboard net worth

### Auto FX (Phase 2 scope)
- Pluggable API source field (`source: 'manual' | 'api'`) already on the schema
- Wire a free FX API (e.g. Open Exchange Rates free tier) behind a settings toggle
- Store fetched rates with `source: 'api'`; manual rates always override for the same date

---

## Backlog / Phase 3

| Feature | Notes |
|---|---|
| Multi-user / entity support | Separate ledgers per "entity" (personal vs business) |
| Double-entry ledger view | Full debit/credit view per transaction |
| Tax report export | Group by country, summarise income/expense per fiscal year |
| Receipt OCR | Was started earlier; re-integrate with transaction form |
| Push notifications | Recurring transaction reminders |
| iCloud / Google Drive backup | Full SQLite backup, not just CSV |
| Widget | Net worth / today's spending on home screen |

---

## Key architectural invariants (do not break)

1. **Ledger is append-only** — never update or delete `ledger_entries` rows except via `deleteLedgerEntriesForTransaction` when deleting the parent transaction.
2. **Balance is derived** — always use `getLedgerBalanceForAccount` for display; the cached `accounts.balance` column is only updated by `createTransactionWithBalanceUpdate`.
3. **Money is TEXT** — amounts are stored as `TEXT` strings in SQLite to avoid float drift. Parse with `parseFloat`; round with `Math.round(n * 100) / 100`.
4. **No Intl.NumberFormat** — Hermes on Android has incomplete `Intl` support. Use `formatMoney` / `useMoneyFormatter` instead.
5. **Migrations are versioned** — bump `SCHEMA_VERSION` and add a new `if (current < N)` block. Never edit past blocks.
6. **All stores in Promise.all** — every Zustand store with a `load()` must be in the `Promise.all` in `RootLayout` or the splash screen will never dismiss.
