# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Project

Personal finance app — React Native + Expo (SDK 54), Expo Router, SQLite, React Native Paper, Zustand. TypeScript strict mode. See [docs/PERSONAL_EXPENSE_MANAGER.md](docs/PERSONAL_EXPENSE_MANAGER.md) for the product blueprint.

## Commands

- `npm start` — Expo dev server
- `npm run android` / `npm run ios` / `npm run web`
- `npm run lint` — `expo lint` (ESLint 9 + `eslint-config-expo`)

No test runner is configured. Do not claim tests pass unless one is added.

## Architecture

- **Routing** — Expo Router file-based. Tabs in [app/(tabs)/](app/(tabs)/); modal transaction screens in [app/transaction/](app/transaction/). Root provider stack in [app/_layout.tsx](app/_layout.tsx) wires `SafeAreaProvider` → `PaperProvider` → navigation `ThemeProvider`.
- **Data layer** — synchronous `expo-sqlite` opened once in [src/db/db.ts](src/db/db.ts). Schema/migrations in [src/db/migrations.ts](src/db/migrations.ts), seed data in [src/db/seed.ts](src/db/seed.ts). Per-entity query modules: [accounts.ts](src/db/accounts.ts), [categories.ts](src/db/categories.ts), [transactions.ts](src/db/transactions.ts), [budgets.ts](src/db/budgets.ts). Migrations + seed run once from `RootLayout` before stores hydrate.
- **State** — Zustand stores in [src/store/](src/store/) mirror DB tables. Each store exposes a `load()` that reads from the db module; mutations should write through the db module then refresh store state. Components read from stores, not directly from the db.
- **Shared code** — reusable UI in [src/components/](src/components/), types in [src/types/index.ts](src/types/index.ts), helpers in [src/utils/](src/utils/) (`format`, `date`, `id` via nanoid).
- **Path alias** — `@/*` maps to the repo root (see [tsconfig.json](tsconfig.json)). Import as `@/src/store/...`, `@/hooks/...`.

## Conventions

- TS strict — no `any` without a reason. Prefer types from [src/types/index.ts](src/types/index.ts).
- UI is React Native Paper (MD3). Theme flips on `useColorScheme`; don't hardcode colors — use `theme.colors`.
- IDs are string (nanoid), timestamps are `INTEGER` epoch ms.
- When adding a table or column, update both [src/db/migrations.ts](src/db/migrations.ts) and the matching type — migrations are versioned, never edit a past migration.
- Keep db access inside `src/db/*`; keep React/Paper code out of db modules.

## Gotchas

- `expo-sqlite` here uses the **sync** API (`openDatabaseSync`, `execSync`/`getAllSync`). The blueprint doc still shows the old `db.transaction(tx => ...)` callback API — ignore that, follow the current code.
- `RootLayout` returns `null` until migrations, seed, and all four stores finish loading. If you add a new store, add it to the `Promise.all` in [app/_layout.tsx](app/_layout.tsx) or the splash will never dismiss.
- Shell is bash-on-Windows — use forward slashes and `/dev/null`, not `NUL`.
