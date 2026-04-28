Goal: Build **multi-currency, multi-account, multi-entity personal finance system**


Let’s design this like a professional system, but still pragmatic for an **Expo + SQLite + Zustand app**.

---

# 🧠 1. Core Design Principle

You should **NOT separate income vs expense tables**.

Instead, model everything as:

👉 **Transactions with direction + accounts**

This is basically **double-entry lite accounting** (you don’t need full accounting complexity, but borrow the structure).

---

# 🧱 2. Core Entities (Database Schema)

## 1. User (optional for now)

```ts
User {
  id
  baseCurrency: 'EUR' | 'USD' | etc
}
```

---

## 2. Currency

```ts
Currency {
  code: 'EUR' | 'USD' | 'HUF' | 'GBP'
  symbol: '€' | '$' | 'Ft'
  decimals: number
}
```

---

## 3. Account (VERY IMPORTANT)

Represents:

* bank accounts
* cash
* Revolut / Wise
* crypto wallets
* investment accounts

```ts
Account {
  id
  name: string
  type: 'bank' | 'cash' | 'investment' | 'crypto' | 'loan'
  currency: string (FK -> Currency.code)
  balance: number (cached)
  institution?: string (e.g. "Wise", "OTP")
}
```

💡 Example:

* EUR Wise account
* HUF OTP account
* USD brokerage account

---

## 4. Category

```ts
Category {
  id
  name: string
  type: 'expense' | 'income' | 'transfer'
  parentId?: string
}
```

---

## 5. Transaction (THE CORE)

```ts
Transaction {
  id
  date: string
  amount: number
  currency: string

  fromAccountId?: string
  toAccountId?: string

  categoryId?: string
  note?: string

  type: 'expense' | 'income' | 'transfer'
}
```

---

### 🔥 Examples

#### Expense

```ts
amount: 10 EUR
fromAccount: Revolut EUR
category: Food
type: expense
```

#### Income

```ts
amount: 2000 USD
toAccount: Wise USD
category: Salary
type: income
```

#### Transfer (CRUCIAL for multi-currency)

```ts
from: EUR account
to: USD account
amount: 100 EUR
type: transfer
```

---

## 6. Exchange Rate (CRITICAL for nomads)

```ts
ExchangeRate {
  fromCurrency: 'EUR'
  toCurrency: 'USD'
  rate: number
  date: string
}
```

💡 Needed for:

* portfolio value in base currency
* reports

---

## 7. Investment

```ts
Asset {
  id
  name: string (e.g. "AAPL", "BTC")
  type: 'stock' | 'crypto' | 'etf'
  currency: string
}
```

```ts
Holding {
  id
  accountId
  assetId
  quantity
  avgBuyPrice
}
```

---

## 8. Loan

```ts
Loan {
  id
  name
  principal
  interestRate
  currency
  startDate
}
```

```ts
LoanPayment {
  id
  loanId
  amount
  interestPart
  principalPart
  date
}
```

---

# 🌍 3. Multi-Currency Strategy (THIS IS WHERE MOST APPS FAIL)

We need **3 layers of money**:

### 1. Native amount

```ts
amount: 100
currency: 'USD'
```

### 2. Account currency (same usually)

### 3. Base currency (for reports)

```ts
baseAmount: 92 EUR
```

💡 Store or compute:

* Either store `baseAmount`
* Or compute using `ExchangeRate`

---

# 🔄 4. Transfers & FX Handling

When converting currencies:

👉 **Store BOTH sides explicitly**

```ts
Transaction {
  type: 'transfer'
  fromAccount: EUR account
  toAccount: USD account

  amount: 100 EUR
  receivedAmount: 108 USD
  exchangeRate: 1.08
}
```

This avoids:

* rounding issues
* historical inaccuracies

---

# 🧭 5. Location / Nomad Aspect

Add optional:

```ts
Transaction {
  country: 'HU' | 'TH' | 'ES'
  city?: string
}
```

Why?

* spending analytics per country
* tax insights later

---

# 📱 6. UI / UX Flow (React Native)

### Main Tabs

1. **Dashboard**

   * Net worth (converted)
   * Account balances
   * Monthly summary

2. **Transactions**

   * unified list (NOT separate income/expense screens)

3. **Accounts**

   * grouped by currency

4. **Investments**

   * holdings + P/L

5. **Loans**

   * remaining balance

---

# ⚙️ 7. Zustand Store Structure

```ts
useFinanceStore = {
  accounts: [],
  transactions: [],
  categories: [],
  exchangeRates: [],

  addTransaction(),
  transferFunds(),
  convertCurrency(),
}
```

---

# 🧩 8. Folder Structure (Expo)

```bash
/src
  /db
    schema.ts
    migrations.ts

  /features
    /transactions
    /accounts
    /investments
    /loans

  /services
    fx.service.ts
    portfolio.service.ts

  /store
    finance.store.ts
```

---

# 🚀 9. MVP vs Advanced

### MVP (build this first)

* Accounts (multi-currency)
* Transactions (income/expense/transfer)
* Categories
* Manual FX rate input

### Phase 2

* Investments
* Loans
* Auto FX API
* OCR receipts (you already started this)

### Phase 3 (pro-level)

* Double-entry ledger
* Tax reports
* Multi-user / tenants

---

# ⚠️ Common Mistakes to Avoid

❌ Separate tables for income/expense
❌ Ignoring transfers
❌ No FX handling
❌ Storing only one currency
❌ No account abstraction

---

# 💡 Final Thought

What we are building is essentially:

👉 a **portable personal finance system for a global lifestyle**

So we think like:

* **Revolut + YNAB + Portfolio tracker combined**

---

 **production-grade but still pragmatic for Expo SQLite**.

We’ll cover:

1. ✅ SQLite schema (Expo-ready)
2. ✅ TypeScript models
3. ✅ Zod validation schemas
4. ✅ Notes for multi-currency + transfers

---

# 🧱 1. SQLite Schema (Expo SQLite Ready)

This is designed for:

* fast queries
* offline-first
* minimal joins where possible

```sql
PRAGMA foreign_keys = ON;

-- =====================
-- CURRENCIES
-- =====================
CREATE TABLE currencies (
  code TEXT PRIMARY KEY, -- 'EUR', 'USD'
  symbol TEXT NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 2
);

-- =====================
-- ACCOUNTS
-- =====================
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'bank' | 'cash' | 'investment' | 'crypto' | 'loan'
  currency_code TEXT NOT NULL,
  balance REAL NOT NULL DEFAULT 0,
  institution TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (currency_code) REFERENCES currencies(code)
);

CREATE INDEX idx_accounts_currency ON accounts(currency_code);

-- =====================
-- CATEGORIES
-- =====================
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'expense' | 'income' | 'transfer'
  parent_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- =====================
-- TRANSACTIONS
-- =====================
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,

  type TEXT NOT NULL, -- 'expense' | 'income' | 'transfer'

  amount REAL NOT NULL,
  currency_code TEXT NOT NULL,

  from_account_id TEXT,
  to_account_id TEXT,

  -- FX handling
  received_amount REAL,
  exchange_rate REAL,

  category_id TEXT,
  note TEXT,

  country TEXT,
  city TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY (currency_code) REFERENCES currencies(code),
  FOREIGN KEY (from_account_id) REFERENCES accounts(id),
  FOREIGN KEY (to_account_id) REFERENCES accounts(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_accounts ON transactions(from_account_id, to_account_id);

-- =====================
-- EXCHANGE RATES
-- =====================
CREATE TABLE exchange_rates (
  id TEXT PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate REAL NOT NULL,
  date TEXT NOT NULL,

  UNIQUE(from_currency, to_currency, date)
);

-- =====================
-- ASSETS (INVESTMENTS)
-- =====================
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL, -- 'AAPL', 'BTC'
  type TEXT NOT NULL, -- 'stock' | 'crypto' | 'etf'
  currency_code TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- =====================
-- HOLDINGS
-- =====================
CREATE TABLE holdings (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  quantity REAL NOT NULL,
  avg_buy_price REAL NOT NULL,

  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);

-- =====================
-- LOANS
-- =====================
CREATE TABLE loans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  principal REAL NOT NULL,
  interest_rate REAL NOT NULL,
  currency_code TEXT NOT NULL,
  start_date TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- =====================
-- LOAN PAYMENTS
-- =====================
CREATE TABLE loan_payments (
  id TEXT PRIMARY KEY,
  loan_id TEXT NOT NULL,
  amount REAL NOT NULL,
  interest_part REAL NOT NULL,
  principal_part REAL NOT NULL,
  date TEXT NOT NULL,

  FOREIGN KEY (loan_id) REFERENCES loans(id)
);
```

---

# 🧩 2. TypeScript Models

```ts
// shared
export type CurrencyCode = 'EUR' | 'USD' | 'HUF' | 'GBP';

export type AccountType =
  | 'bank'
  | 'cash'
  | 'investment'
  | 'crypto'
  | 'loan';

export type TransactionType =
  | 'expense'
  | 'income'
  | 'transfer';

// =====================

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  decimals: number;
}

// =====================

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency_code: CurrencyCode;
  balance: number;
  institution?: string;
  created_at: string;
  updated_at: string;
}

// =====================

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  parent_id?: string | null;
  created_at: string;
}

// =====================

export interface Transaction {
  id: string;
  date: string;

  type: TransactionType;

  amount: number;
  currency_code: CurrencyCode;

  from_account_id?: string | null;
  to_account_id?: string | null;

  received_amount?: number | null;
  exchange_rate?: number | null;

  category_id?: string | null;
  note?: string | null;

  country?: string | null;
  city?: string | null;

  created_at: string;
  updated_at: string;
}

// =====================

export interface ExchangeRate {
  id: string;
  from_currency: CurrencyCode;
  to_currency: CurrencyCode;
  rate: number;
  date: string;
}

// =====================

export interface Asset {
  id: string;
  name: string;
  type: 'stock' | 'crypto' | 'etf';
  currency_code: CurrencyCode;
  created_at: string;
}

// =====================

export interface Holding {
  id: string;
  account_id: string;
  asset_id: string;
  quantity: number;
  avg_buy_price: number;
}

// =====================

export interface Loan {
  id: string;
  name: string;
  principal: number;
  interest_rate: number;
  currency_code: CurrencyCode;
  start_date: string;
  created_at: string;
}

// =====================

export interface LoanPayment {
  id: string;
  loan_id: string;
  amount: number;
  interest_part: number;
  principal_part: number;
  date: string;
}
```

---

# ✅ 3. Zod Validation Schemas

```ts
import { z } from 'zod';

// =====================

export const currencyCodeSchema = z.enum(['EUR', 'USD', 'HUF', 'GBP']);

export const accountTypeSchema = z.enum([
  'bank',
  'cash',
  'investment',
  'crypto',
  'loan',
]);

export const transactionTypeSchema = z.enum([
  'expense',
  'income',
  'transfer',
]);

// =====================
// ACCOUNT
// =====================

export const accountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: accountTypeSchema,
  currency_code: currencyCodeSchema,
  balance: z.number(),
  institution: z.string().optional(),

  created_at: z.string(),
  updated_at: z.string(),
});

// =====================
// TRANSACTION
// =====================

export const transactionSchema = z.object({
  id: z.string().uuid(),
  date: z.string(),

  type: transactionTypeSchema,

  amount: z.number().positive(),
  currency_code: currencyCodeSchema,

  from_account_id: z.string().uuid().nullable().optional(),
  to_account_id: z.string().uuid().nullable().optional(),

  received_amount: z.number().nullable().optional(),
  exchange_rate: z.number().nullable().optional(),

  category_id: z.string().uuid().nullable().optional(),
  note: z.string().optional(),

  country: z.string().optional(),
  city: z.string().optional(),

  created_at: z.string(),
  updated_at: z.string(),
})
.superRefine((data, ctx) => {
  // BUSINESS RULES

  if (data.type === 'expense' && !data.from_account_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Expense must have from_account_id',
    });
  }

  if (data.type === 'income' && !data.to_account_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Income must have to_account_id',
    });
  }

  if (data.type === 'transfer') {
    if (!data.from_account_id || !data.to_account_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Transfer must have both accounts',
      });
    }
  }
});

// =====================
// EXCHANGE RATE
// =====================

export const exchangeRateSchema = z.object({
  id: z.string().uuid(),
  from_currency: currencyCodeSchema,
  to_currency: currencyCodeSchema,
  rate: z.number().positive(),
  date: z.string(),
});

// =====================
// HOLDING
// =====================

export const holdingSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  asset_id: z.string().uuid(),
  quantity: z.number().positive(),
  avg_buy_price: z.number().positive(),
});

// =====================
// LOAN
// =====================

export const loanSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  principal: z.number().positive(),
  interest_rate: z.number().min(0),
  currency_code: currencyCodeSchema,
  start_date: z.string(),
  created_at: z.string(),
});
```

---

# ⚠️ 4. Critical Design Notes (Don’t Skip)

### 1. NEVER trust `balance`

* It’s just a cache
* Always recompute from transactions if needed

---

### 2. Transfers MUST store both sides

```ts
amount: 100 EUR
received_amount: 108 USD
exchange_rate: 1.08
```

---

### 3. Dates

Use ISO:

```ts
new Date().toISOString()
```

---

### 4. IDs

Use:

```ts
import { v4 as uuid } from 'uuid';
```

---

Good call—this is where things become **clean, scalable, and future-proof**.

Here is a **production-ready Drizzle setup for Expo (SQLite)** with:

* ✅ Drizzle schema (aligned with your DB design)
* ✅ Expo SQLite + Drizzle client
* ✅ Migration strategy (mobile-friendly ⚠️)
* ✅ Example queries (transactions, transfers)
* ✅ Clean folder structure

---

# 🧱 1. Install Dependencies

```bash
npm install drizzle-orm drizzle-kit expo-sqlite
npm install uuid
```

---

# 📁 2. Suggested Project Structure

```bash
/src
  /db
    client.ts
    schema.ts
    migrations.ts
  /repositories
    account.repository.ts
    transaction.repository.ts
  /services
    transaction.service.ts
```

---

# 🧬 3. Drizzle Schema (SQLite)

📄 `/src/db/schema.ts`

```ts
import {
  sqliteTable,
  text,
  real,
  integer,
} from 'drizzle-orm/sqlite-core';

// =====================
// CURRENCIES
// =====================
export const currencies = sqliteTable('currencies', {
  code: text('code').primaryKey(),
  symbol: text('symbol').notNull(),
  decimals: integer('decimals').notNull().default(2),
});

// =====================
// ACCOUNTS
// =====================
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  currency_code: text('currency_code').notNull(),
  balance: real('balance').notNull().default(0),
  institution: text('institution'),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

// =====================
// CATEGORIES
// =====================
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  parent_id: text('parent_id'),
  created_at: text('created_at').notNull(),
});

// =====================
// TRANSACTIONS
// =====================
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),

  type: text('type').notNull(),

  amount: real('amount').notNull(),
  currency_code: text('currency_code').notNull(),

  from_account_id: text('from_account_id'),
  to_account_id: text('to_account_id'),

  received_amount: real('received_amount'),
  exchange_rate: real('exchange_rate'),

  category_id: text('category_id'),
  note: text('note'),

  country: text('country'),
  city: text('city'),

  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
});

// =====================
// EXCHANGE RATES
// =====================
export const exchangeRates = sqliteTable('exchange_rates', {
  id: text('id').primaryKey(),
  from_currency: text('from_currency').notNull(),
  to_currency: text('to_currency').notNull(),
  rate: real('rate').notNull(),
  date: text('date').notNull(),
});

// =====================
// ASSETS
// =====================
export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  currency_code: text('currency_code').notNull(),
  created_at: text('created_at').notNull(),
});

// =====================
// HOLDINGS
// =====================
export const holdings = sqliteTable('holdings', {
  id: text('id').primaryKey(),
  account_id: text('account_id').notNull(),
  asset_id: text('asset_id').notNull(),
  quantity: real('quantity').notNull(),
  avg_buy_price: real('avg_buy_price').notNull(),
});

// =====================
// LOANS
// =====================
export const loans = sqliteTable('loans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  principal: real('principal').notNull(),
  interest_rate: real('interest_rate').notNull(),
  currency_code: text('currency_code').notNull(),
  start_date: text('start_date').notNull(),
  created_at: text('created_at').notNull(),
});

// =====================
// LOAN PAYMENTS
// =====================
export const loanPayments = sqliteTable('loan_payments', {
  id: text('id').primaryKey(),
  loan_id: text('loan_id').notNull(),
  amount: real('amount').notNull(),
  interest_part: real('interest_part').notNull(),
  principal_part: real('principal_part').notNull(),
  date: text('date').notNull(),
});
```

---

# ⚙️ 4. Drizzle Client (Expo SQLite)

📄 `/src/db/client.ts`

```ts
import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';

const expoDb = SQLite.openDatabaseSync('finance.db');

export const db = drizzle(expoDb);
```

---

# ⚠️ 5. Migrations (IMPORTANT for Mobile)

Drizzle migrations don’t run automatically on mobile—you must apply them manually.

---

## 📄 drizzle.config.ts

```ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
} satisfies Config;
```

---

## Generate migration

```bash
npx drizzle-kit generate
```

---

## 📄 `/src/db/migrations.ts`

```ts
import { db } from './client';
import { sql } from 'drizzle-orm';

export async function runMigrations() {
  // VERY SIMPLE strategy for mobile MVP

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS __migrations (
      id TEXT PRIMARY KEY
    );
  `);

  // Example migration
  const migrationId = 'init_v1';

  const existing = await db.get<{ id: string }>(
    sql`SELECT id FROM __migrations WHERE id = ${migrationId}`
  );

  if (!existing) {
    // run your SQL manually here OR import generated SQL

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS currencies (
        code TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        decimals INTEGER NOT NULL DEFAULT 2
      );
    `);

    // Add all tables (or load from file)

    await db.run(
      sql`INSERT INTO __migrations (id) VALUES (${migrationId})`
    );
  }
}
```

👉 Call this once on app startup.

---

# 🧠 6. Repository Example

## 📄 `/src/repositories/account.repository.ts`

```ts
import { db } from '@/db/client';
import { accounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const accountRepository = {
  async getAll() {
    return db.select().from(accounts);
  },

  async getById(id: string) {
    const result = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id));

    return result[0];
  },

  async create(account: typeof accounts.$inferInsert) {
    return db.insert(accounts).values(account);
  },
};
```

---

# 💸 7. Transaction Service (with FX logic 🔥)

📄 `/src/services/transaction.service.ts`

```ts
import { db } from '@/db/client';
import { transactions, accounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

export async function createTransfer({
  fromAccountId,
  toAccountId,
  amount,
  receivedAmount,
  exchangeRate,
}: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  receivedAmount: number;
  exchangeRate: number;
}) {
  const now = new Date().toISOString();

  await db.insert(transactions).values({
    id: uuid(),
    date: now,
    type: 'transfer',

    amount,
    received_amount: receivedAmount,
    exchange_rate: exchangeRate,

    from_account_id: fromAccountId,
    to_account_id: toAccountId,

    currency_code: 'EUR', // from account currency ideally
    created_at: now,
    updated_at: now,
  });

  // Update balances (simple version)
  await db.run(`
    UPDATE accounts SET balance = balance - ${amount}
    WHERE id = '${fromAccountId}'
  `);

  await db.run(`
    UPDATE accounts SET balance = balance + ${receivedAmount}
    WHERE id = '${toAccountId}'
  `);
}
```

---

# 🚨 8. Important Real-World Notes

### 1. Drizzle + Expo = Good, but:

* no built-in migration runner → you manage it
* keep migrations simple

---

### 2. Balance updates

Eventually replace with:

* derived balance (better)
* or transaction ledger

---

### 3. FX precision

Use:

```ts
Math.round(value * 100) / 100
```

or a decimal lib later

---

# 🚀 What You Have Now

You now have:

✅ Typed schema
✅ SQLite integration
✅ Migration strategy
✅ Repository pattern
✅ Transaction logic with FX

---

# 👉 Next Step 

👉 Build a **Transaction Engine**


We already have Drizzle + schema. Now  build a **transaction engine with ledger principles**, FX handling, and derived balances.

---

# 🧠 1. Core Idea (Upgrade Your Mental Model)

Right now we have:

* `transactions` table
* `accounts.balance`

👉 That’s fragile.

Instead, introduce:

## 🔥 A **Ledger (entries table)**

Every transaction becomes **1..n entries**.

This gives:

* correct balances
* auditability
* clean FX handling
* future tax/accounting features

---

# 🧱 2. New Table: Ledger Entries

Add this to the Drizzle schema:

```ts
export const ledgerEntries = sqliteTable('ledger_entries', {
  id: text('id').primaryKey(),

  transaction_id: text('transaction_id').notNull(),

  account_id: text('account_id').notNull(),

  // Positive = money IN, Negative = money OUT
  amount: real('amount').notNull(),

  currency_code: text('currency_code').notNull(),

  created_at: text('created_at').notNull(),
});
```

---

# 🧭 3. How Transactions Map to Ledger

## 💸 Expense

> Buy coffee 5 EUR from Revolut

| Account     | Amount |
| ----------- | ------ |
| Revolut EUR | -5     |

---

## 💰 Income

> Salary 2000 USD to Wise

| Account  | Amount |
| -------- | ------ |
| Wise USD | +2000  |

---

## 🔁 Transfer (same currency)

> Move 100 EUR between accounts

| Account      | Amount |
| ------------ | ------ |
| From account | -100   |
| To account   | +100   |

---

## 💱 FX Transfer (CRITICAL)

> Convert 100 EUR → 108 USD

| Account     | Amount |
| ----------- | ------ |
| EUR account | -100   |
| USD account | +108   |

👉 No magic. No hidden conversion.

---

# ⚙️ 4. Transaction Engine Service

📄 `/src/services/ledger.service.ts`

```ts
import { db } from '@/db/client';
import { ledgerEntries, transactions } from '@/db/schema';
import { v4 as uuid } from 'uuid';

const now = () => new Date().toISOString();

export async function createExpense({
  accountId,
  amount,
  currency,
  categoryId,
  note,
}: {
  accountId: string;
  amount: number;
  currency: string;
  categoryId?: string;
  note?: string;
}) {
  const txId = uuid();
  const timestamp = now();

  // 1. Insert transaction
  await db.insert(transactions).values({
    id: txId,
    date: timestamp,
    type: 'expense',
    amount,
    currency_code: currency,
    from_account_id: accountId,
    category_id: categoryId,
    note,
    created_at: timestamp,
    updated_at: timestamp,
  });

  // 2. Ledger entry
  await db.insert(ledgerEntries).values({
    id: uuid(),
    transaction_id: txId,
    account_id: accountId,
    amount: -amount,
    currency_code: currency,
    created_at: timestamp,
  });
}
```

---

## 🔁 Transfer with FX

```ts
export async function createTransfer({
  fromAccountId,
  toAccountId,
  amount,
  receivedAmount,
  fromCurrency,
  toCurrency,
}: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  receivedAmount: number;
  fromCurrency: string;
  toCurrency: string;
}) {
  const txId = uuid();
  const timestamp = now();

  await db.insert(transactions).values({
    id: txId,
    date: timestamp,
    type: 'transfer',

    amount,
    received_amount: receivedAmount,

    from_account_id: fromAccountId,
    to_account_id: toAccountId,

    currency_code: fromCurrency,
    exchange_rate: receivedAmount / amount,

    created_at: timestamp,
    updated_at: timestamp,
  });

  // FROM
  await db.insert(ledgerEntries).values({
    id: uuid(),
    transaction_id: txId,
    account_id: fromAccountId,
    amount: -amount,
    currency_code: fromCurrency,
    created_at: timestamp,
  });

  // TO
  await db.insert(ledgerEntries).values({
    id: uuid(),
    transaction_id: txId,
    account_id: toAccountId,
    amount: receivedAmount,
    currency_code: toCurrency,
    created_at: timestamp,
  });
}
```

---

# 📊 5. Balance = Derived (No More Bugs)

## Get account balance

```ts
import { sql } from 'drizzle-orm';

export async function getAccountBalance(accountId: string) {
  const result = await db.get<{ total: number }>(sql`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM ledger_entries
    WHERE account_id = ${accountId}
  `);

  return result?.total ?? 0;
}
```

👉 This is **always correct**.

---

# 🌍 6. Portfolio in Base Currency

## Convert everything to EUR

```ts
export async function getNetWorth(baseCurrency: string) {
  const result = await db.all<{
    account_id: string;
    total: number;
    currency_code: string;
  }>(sql`
    SELECT account_id, SUM(amount) as total, currency_code
    FROM ledger_entries
    GROUP BY account_id, currency_code
  `);

  // Convert using exchange rates (you implement)
  return result;
}
```

---

# 💱 7. FX Engine (Simple Version)

📄 `/src/services/fx.service.ts`

```ts
export function convert({
  amount,
  rate,
}: {
  amount: number;
  rate: number;
}) {
  return Math.round(amount * rate * 100) / 100;
}
```

---

# 🔐 8. Invariants (VERY IMPORTANT)

The engine must enforce:

### ✅ 1. Ledger is append-only

NEVER update entries.

---

### ✅ 2. Transfers must balance logically

Even with FX:

* value changes are explicit (not hidden)

---

### ✅ 3. No direct balance updates

Kill this:

```ts
UPDATE accounts SET balance = ...
```

---

# 🧭 9. Zustand Integration (Clean)

Store only:

```ts
{
  accounts: [],
  transactions: [],
}
```

👉 NEVER store:

* balances
* computed totals

Always derive.

---

# 🚀 10. What we now have:


✅ Ledger-based system
✅ Multi-currency safe model
✅ FX-aware transfers
✅ Audit-safe history
✅ Scalable to backend

---


