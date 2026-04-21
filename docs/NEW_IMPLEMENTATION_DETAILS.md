**Unified Transaction Model** (React Native Expo + TypeScript + SQLite)

This is a **single `Transaction`** table that replaces the separate Income/Expense models and also fully supports:
- Regular income & expenses
- Transfers between your own accounts
- Investments (stocks, ETFs, crypto – buy/sell with quantity & fees)
- Loans & credit (borrowing, repayments, interest tracking)

### Why unified?
- One table → simpler queries, dashboards, charts, search, and reporting in HUF.
- All money movements are in the same place.
- Easy to calculate net worth, cash flow, portfolio performance.
- SQLite-friendly (lean + JSON for type-specific data).

### TransactionType Enum (TypeScript)
```ts
export type TransactionType =
  | 'EXPENSE'              // e.g. Amazon book
  | 'INCOME'               // e.g. freelance USD
  | 'TRANSFER'             // between your own accounts/wallets
  | 'INVESTMENT_BUY'       // crypto/stock purchase
  | 'INVESTMENT_SELL'      // crypto/stock sale
  | 'LOAN_RECEIVED'        // borrowed money (inflow)
  | 'LOAN_REPAYMENT'       // repayment (outflow + interest)
  | 'DIVIDEND'             // investment income
  | 'INTEREST'             // interest earned on savings/loan
  | 'CREDIT_CARD_PAYMENT'; // special case if you want to track credit separately
```

### Core Fields for the Transaction Model

| Field                  | SQLite Type     | TS Type          | Description / Why essential                                                                 | Example (Amazon book)                  | Example (Buy 0.05 BTC)                  |
|------------------------|-----------------|------------------|---------------------------------------------------------------------------------------------|----------------------------------------|-----------------------------------------|
| **id**                 | TEXT PRIMARY KEY| `string`         | UUID or ULID                                                                                | `tr_abc123`                            | `tr_def456`                             |
| **type**               | TEXT            | `TransactionType`| Determines nature of transaction                                                            | `'EXPENSE'`                            | `'INVESTMENT_BUY'`                      |
| **date**               | TEXT            | `string`         | ISO datetime (sortable)                                                                     | `2026-04-20T14:30:00Z`                 | `2026-04-20T15:00:00Z`                  |
| **amount**             | TEXT            | `string`         | Original amount (positive always) – use string for precision                                | `12.99`                                | `0.05`                                  |
| **currency**           | TEXT            | `string`         | ISO 4217 or crypto symbol                                                                   | `USD`                                  | `BTC`                                   |
| **amountBase**         | TEXT            | `string`         | Converted to user’s base currency (HUF)                                                     | `4856.32`                              | `18750.00`                              |
| **baseCurrency**       | TEXT            | `string`         | Usually `HUF`                                                                               | `HUF`                                  | `HUF`                                   |
| **exchangeRate**       | TEXT            | `string`         | Rate used at the moment                                                                     | `373.85`                               | `375000` (BTC/HUF)                      |
| **accountId**          | TEXT            | `string \| null` | Which account/wallet was used (bank, Binance, credit card, loan account, etc.)             | `acc_visa`                             | `acc_binance`                           |
| **categoryId**         | TEXT            | `string \| null` | Reference to Category (different categories per type)                                       | `cat_books`                            | `null` (or investment category)         |
| **description**        | TEXT            | `string`         | User title                                                                                  | `Clean Code - Robert C. Martin`        | `Bitcoin purchase`                      |
| **source**             | TEXT            | `string \| null` | Who paid / merchant / counterparty                                                          | `Amazon.com`                           | `Binance`                               |
| **tags**               | TEXT            | `string[]`       | JSON array (e.g. `["crypto","long-term"]`)                                                  | `["book","kindle"]`                    | `["crypto","btc"]`                      |
| **notes**              | TEXT            | `string \| null` | Extra info                                                                                  | `Delivered to Kindle`                  | `Fee: 2.50 USD`                         |
| **details**            | TEXT            | `object`         | JSON – type-specific data (see below)                                                       | `{}`                                   | `{quantity: "0.05", unitPrice: "62000", fees: "2.50", assetType: "crypto"}` |
| **relatedTransactionId**| TEXT           | `string \| null` | Links paired transactions (transfer in/out, buy+sell tax lot, etc.)                        | `null`                                 | `null`                                  |
| **isRecurring**        | INTEGER         | `boolean`        | 0/1                                                                                         | `0`                                    | `0`                                     |
| **recurringRule**      | TEXT            | `object \| null` | JSON for recurring logic                                                                    | `null`                                 | `null`                                  |
| **status**             | TEXT            | `string`         | `pending` / `confirmed` / `cancelled`                                                       | `confirmed`                            | `confirmed`                             |
| **createdAt**          | TEXT            | `string`         | ISO                                                                                         | auto                                   | auto                                    |
| **updatedAt**          | TEXT            | `string`         | ISO                                                                                         | auto                                   | auto                                    |

**details JSON examples** (stored as TEXT in SQLite):
- `INVESTMENT_BUY` / `INVESTMENT_SELL`: `{ assetType: "crypto"|"stock"|"etf", symbol: "BTC", quantity: "0.05", unitPrice: "62000", fees: "2.50", feeCurrency: "USD" }`
- `LOAN_REPAYMENT`: `{ loanId: "loan_001", principalPaid: "10000", interestPaid: "450", remainingBalance: "89000" }`
- `LOAN_RECEIVED`: `{ loanId: "loan_001", interestRate: "8.5", termMonths: 36 }`
- Regular expense/income: `{}` (empty)

### TypeScript Interface (ready to copy)
```ts
export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;                    // ISO string
  amount: string;                  // e.g. "12.99" or "0.05"
  currency: string;
  amountBase: string;
  baseCurrency: string;
  exchangeRate: string;
  accountId: string | null;
  categoryId: string | null;
  description: string;
  source: string | null;
  tags: string[];
  notes: string | null;
  details: Record<string, any>;    // type-specific JSON
  relatedTransactionId: string | null;
  isRecurring: boolean;
  recurringRule: Record<string, any> | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}
```

### SQLite Schema (ready to run with expo-sqlite)
```sql
CREATE TABLE IF NOT EXISTS transactions (
  id                  TEXT PRIMARY KEY,
  type                TEXT NOT NULL CHECK (type IN ('EXPENSE','INCOME','TRANSFER','INVESTMENT_BUY','INVESTMENT_SELL','LOAN_RECEIVED','LOAN_REPAYMENT','DIVIDEND','INTEREST','CREDIT_CARD_PAYMENT')),
  date                TEXT NOT NULL,
  amount              TEXT NOT NULL,
  currency            TEXT NOT NULL,
  amountBase          TEXT NOT NULL,
  baseCurrency        TEXT NOT NULL,
  exchangeRate        TEXT NOT NULL,
  accountId           TEXT,
  categoryId          TEXT,
  description         TEXT NOT NULL,
  source              TEXT,
  tags                TEXT NOT NULL DEFAULT '[]',           -- JSON array
  notes               TEXT,
  details             TEXT NOT NULL DEFAULT '{}',           -- JSON for investment/loan specifics
  relatedTransactionId TEXT,
  isRecurring         INTEGER NOT NULL DEFAULT 0,
  recurringRule       TEXT,
  status              TEXT NOT NULL DEFAULT 'confirmed',
  createdAt           TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt           TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (accountId) REFERENCES accounts(id),
  FOREIGN KEY (categoryId) REFERENCES categories(id),
  FOREIGN KEY (relatedTransactionId) REFERENCES transactions(id)
);

-- Indexes for speed (very important on mobile)
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_account ON transactions(accountId);
CREATE INDEX idx_transactions_category ON transactions(categoryId);
```
Here’s everything you requested for your **React Native Expo + TypeScript + SQLite** financial app. The design keeps everything lightweight, performant on mobile, and consistent with the unified `transactions` table we defined earlier.

### 1. Account Model + SQL

**Accounts** represent where your money lives or where debts/investments are held (bank account, crypto wallet, credit card, loan account, cash, brokerage, etc.).

#### Key Fields for `accounts` table

| Field              | SQLite Type     | Description                                                                 | Example                              |
|--------------------|-----------------|-----------------------------------------------------------------------------|--------------------------------------|
| **id**             | TEXT PRIMARY KEY| UUID or short unique string                                                 | `acc_bank_huf`                       |
| **name**           | TEXT            | User-friendly name                                                          | `OTP Bank HUF` or `Binance Wallet`   |
| **type**           | TEXT            | `bank`, `crypto`, `investment`, `credit_card`, `loan`, `cash`, `other`      | `crypto`                             |
| **currency**       | TEXT            | Main currency of the account (or base for loans)                            | `USD` or `BTC`                       |
| **balance**        | TEXT            | Current balance (string for precision) – can be negative for credit/loan    | `1250.75`                            |
| **isActive**       | INTEGER         | 0/1 – soft delete / hide inactive accounts                                  | `1`                                  |
| **icon**           | TEXT (optional) | Emoji or icon name for UI                                                   | `🏦` or `₿`                          |
| **color**          | TEXT (optional) | Hex color for UI                                                            | `#00BFFF`                            |
| **notes**          | TEXT            | Extra info                                                                  | `Main salary account`                |
| **createdAt**      | TEXT            | ISO timestamp                                                               | auto                                 |
| **updatedAt**      | TEXT            | ISO timestamp                                                               | auto                                 |

#### SQL for Accounts Table
```sql
CREATE TABLE IF NOT EXISTS accounts (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('bank', 'crypto', 'investment', 'credit_card', 'loan', 'cash', 'other')),
  currency    TEXT NOT NULL,
  balance     TEXT NOT NULL DEFAULT '0',
  isActive    INTEGER NOT NULL DEFAULT 1,
  icon        TEXT,
  color       TEXT,
  notes       TEXT,
  createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_currency ON accounts(currency);
```

**Tip**: After every transaction that affects an account, you should recalculate or update the `balance` (you can do this in app logic or via a trigger if you prefer).

### 2. Category Model (with separation for income/expense/investment/loan)

One `categories` table with a `transactionType` field. This gives flexibility while allowing UI to show only relevant categories.

#### Fields

| Field                | SQLite Type | Description                                      | Example                          |
|----------------------|-------------|--------------------------------------------------|----------------------------------|
| **id**               | TEXT        | Primary key                                      | `cat_food`                       |
| **name**             | TEXT        | Localized or user-editable name                  | `Groceries` or `Freelance`       |
| **transactionType**  | TEXT        | Links to TransactionType                         | `EXPENSE` / `INCOME` / `INVESTMENT_BUY` etc. |
| **icon**             | TEXT        | Emoji or icon name                               | `🛒`                             |
| **color**            | TEXT        | Hex color                                        | `#FF5733`                        |
| **isDefault**        | INTEGER     | 0/1 – seed some defaults                         | `1`                              |
| **parentId**         | TEXT (optional) | For hierarchical categories (optional)       | null                             |
| **createdAt**        | TEXT        |                                                  | auto                             |

#### SQL for Categories Table
```sql
CREATE TABLE IF NOT EXISTS categories (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  transactionType   TEXT NOT NULL,   -- 'EXPENSE', 'INCOME', 'INVESTMENT_BUY', 'INVESTMENT_SELL', 'LOAN_RECEIVED', etc.
  icon              TEXT,
  color             TEXT,
  isDefault         INTEGER NOT NULL DEFAULT 0,
  parentId          TEXT,
  createdAt         TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (parentId) REFERENCES categories(id)
);

-- Indexes
CREATE INDEX idx_categories_type ON categories(transactionType);
```

**Seeding defaults** (run once on first app launch):
- EXPENSE: Food, Transport, Housing, Books, Entertainment, Utilities...
- INCOME: Salary, Freelance, Dividends, Interest...
- INVESTMENT_BUY / SELL: Crypto, Stocks, ETFs...
- LOAN: Mortgage, Personal Loan, Credit Card Debt...

You can filter categories in the UI based on the selected `TransactionType`.

### 3. Ready-made Expo SQLite Helper Functions (TypeScript)

First, install if not already:
```bash
npx expo install expo-sqlite
```

#### Database Setup (`db.ts` or `database.ts`)
```ts
import * as SQLite from 'expo-sqlite';

export const getDB = async () => {
  const db = await SQLite.openDatabaseAsync('finance.db');
  
  // Enable WAL mode for better performance on mobile
  await db.execAsync('PRAGMA journal_mode = WAL;');
  
  // Create tables (you can call this on app start)
  await createTables(db);
  
  return db;
};

async function createTables(db: SQLite.SQLiteDatabase) {
  // Paste the three CREATE TABLE statements here (transactions from previous response + accounts + categories)
  // You can split them into separate execAsync calls
}
```

#### Generic CRUD Helpers (`transactionService.ts`, `accountService.ts`, etc.)

```ts
import * as SQLite from 'expo-sqlite';
import { Transaction, TransactionType } from './types'; // your types file

// Helper to run queries safely
async function runAsync(db: SQLite.SQLiteDatabase, sql: string, params: any[] = []) {
  return db.runAsync(sql, params);
}

async function getAllAsync<T>(db: SQLite.SQLiteDatabase, sql: string, params: any[] = []): Promise<T[]> {
  return db.getAllAsync<T>(sql, params);
}

async function getFirstAsync<T>(db: SQLite.SQLiteDatabase, sql: string, params: any[] = []): Promise<T | null> {
  return db.getFirstAsync<T>(sql, params);
}

// === Transaction Helpers ===

export async function createTransaction(db: SQLite.SQLiteDatabase, tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
  const id = 'tr_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  const now = new Date().toISOString();

  await runAsync(db, `
    INSERT INTO transactions (
      id, type, date, amount, currency, amountBase, baseCurrency, exchangeRate,
      accountId, categoryId, description, source, tags, notes, details,
      relatedTransactionId, isRecurring, recurringRule, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    tx.type,
    tx.date,
    tx.amount,
    tx.currency,
    tx.amountBase,
    tx.baseCurrency,
    tx.exchangeRate,
    tx.accountId,
    tx.categoryId,
    tx.description,
    tx.source,
    JSON.stringify(tx.tags),
    tx.notes,
    JSON.stringify(tx.details),
    tx.relatedTransactionId,
    tx.isRecurring ? 1 : 0,
    tx.recurringRule ? JSON.stringify(tx.recurringRule) : null,
    tx.status
  ]);

  // Optional: update account balance here
  return { ...tx, id, createdAt: now, updatedAt: now };
}

export async function getTransactions(
  db: SQLite.SQLiteDatabase,
  filters: { type?: TransactionType; startDate?: string; endDate?: string; accountId?: string } = {}
): Promise<Transaction[]> {
  let sql = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (filters.type) {
    sql += ' AND type = ?';
    params.push(filters.type);
  }
  if (filters.startDate) {
    sql += ' AND date >= ?';
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    sql += ' AND date <= ?';
    params.push(filters.endDate);
  }
  if (filters.accountId) {
    sql += ' AND accountId = ?';
    params.push(filters.accountId);
  }

  sql += ' ORDER BY date DESC';

  const rows = await getAllAsync<any>(db, sql, params);

  return rows.map(row => ({
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    details: JSON.parse(row.details || '{}'),
    recurringRule: row.recurringRule ? JSON.parse(row.recurringRule) : null,
    isRecurring: !!row.isRecurring,
  }));
}

// Monthly summary example (very useful for dashboard)
export async function getMonthlySummary(db: SQLite.SQLiteDatabase, yearMonth: string) { // e.g. "2026-04"
  const sql = `
    SELECT 
      type,
      SUM(CAST(amountBase AS REAL)) as totalBase
    FROM transactions 
    WHERE date LIKE ? 
    GROUP BY type
  `;
  return getAllAsync(db, sql, [`${yearMonth}%`]);
}

// === Account Helpers ===

export async function createAccount(db: SQLite.SQLiteDatabase, account: Omit<any, 'id' | 'createdAt' | 'updatedAt'>) {
  const id = 'acc_' + Date.now().toString(36);
  // similar insert logic as transaction...
}

// Add similar functions for updateBalance, getAccounts, etc.

// === Category Helpers ===

export async function getCategoriesByType(db: SQLite.SQLiteDatabase, transactionType: TransactionType) {
  return getAllAsync(db, 
    'SELECT * FROM categories WHERE transactionType = ? ORDER BY name', 
    [transactionType]
  );
}
```

### Quick Tips for Your App

- Always use **parameterized queries** (`?`) to avoid SQL injection.
- Store arrays/objects as **JSON strings** (`JSON.stringify` / `JSON.parse`).
- Update `updatedAt` with `datetime('now')` or in app code.
- For performance: keep indexes on `date`, `type`, `accountId`.
- On transaction creation: recalculate the linked `account.balance` in the same flow.

Here's the complete, production-ready implementation for **Account Balance Update Logic** and **Recurring Transaction Scheduler** tailored to your React Native Expo + TypeScript + SQLite setup.

### 1. Account Balance Update Logic

**Recommended Approach (App-level with SQLite Transaction)**  
- We update the balance **atomically** together with the transaction insert using `withTransactionAsync`.  
- This prevents race conditions if multiple transactions happen quickly.  
- Direction of balance change depends on `TransactionType`.

#### Updated `transactionService.ts`

```ts
import * as SQLite from 'expo-sqlite';
import { Transaction, TransactionType } from './types';

function getBalanceDelta(type: TransactionType, amount: string): string {
  const numAmount = parseFloat(amount);
  switch (type) {
    case 'INCOME':
    case 'LOAN_RECEIVED':
    case 'DIVIDEND':
    case 'INTEREST':
      return (numAmount).toFixed(2);           // + 

    case 'EXPENSE':
    case 'LOAN_REPAYMENT':
    case 'CREDIT_CARD_PAYMENT':
      return (-numAmount).toFixed(2);          // -

    case 'INVESTMENT_BUY':
      return (-numAmount).toFixed(2);          // money leaves account

    case 'INVESTMENT_SELL':
      return (numAmount).toFixed(2);           // money enters account

    case 'TRANSFER':
      // For transfers we handle both accounts separately (see below)
      return '0';

    default:
      return '0';
  }
}

export async function createTransactionWithBalanceUpdate(
  db: SQLite.SQLiteDatabase,
  tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Transaction> {
  const id = `tr_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  const now = new Date().toISOString();

  const delta = getBalanceDelta(tx.type, tx.amount);

  await db.withTransactionAsync(async () => {
    // 1. Insert the transaction
    await db.runAsync(`
      INSERT INTO transactions (
        id, type, date, amount, currency, amountBase, baseCurrency, exchangeRate,
        accountId, categoryId, description, source, tags, notes, details,
        relatedTransactionId, isRecurring, recurringRule, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      tx.type,
      tx.date,
      tx.amount,
      tx.currency,
      tx.amountBase,
      tx.baseCurrency,
      tx.exchangeRate,
      tx.accountId,
      tx.categoryId,
      tx.description,
      tx.source,
      JSON.stringify(tx.tags || []),
      tx.notes || null,
      JSON.stringify(tx.details || {}),
      tx.relatedTransactionId || null,
      tx.isRecurring ? 1 : 0,
      tx.recurringRule ? JSON.stringify(tx.recurringRule) : null,
      tx.status || 'confirmed'
    ]);

    // 2. Update account balance (if accountId exists and delta != 0)
    if (tx.accountId && delta !== '0') {
      await db.runAsync(`
        UPDATE accounts 
        SET balance = (CAST(balance AS REAL) + CAST(? AS REAL)),
            updatedAt = datetime('now')
        WHERE id = ?
      `, [delta, tx.accountId]);
    }
  });

  return {
    ...tx,
    id,
    createdAt: now,
    updatedAt: now,
  } as Transaction;
}
```

#### Special Handling for **TRANSFER** (two accounts)

```ts
export async function createTransfer(
  db: SQLite.SQLiteDatabase,
  fromAccountId: string,
  toAccountId: string,
  amount: string,
  currency: string,
  // ... other fields
) {
  const now = new Date().toISOString();
  const fromTxId = `tr_${Date.now().toString(36)}`;
  const toTxId = `tr_${(Date.now() + 1).toString(36)}`;

  await db.withTransactionAsync(async () => {
    // Outflow from source
    await db.runAsync(/* insert transaction type: 'TRANSFER' for fromAccountId, amount negative effectively via delta */);

    // Inflow to destination (you can insert a second transaction with relatedTransactionId = fromTxId)
    await db.runAsync(/* insert second transaction */);

    // Update balances
    await db.runAsync(`UPDATE accounts SET balance = CAST(balance AS REAL) - CAST(? AS REAL) WHERE id = ?`, [amount, fromAccountId]);
    await db.runAsync(`UPDATE accounts SET balance = CAST(balance AS REAL) + CAST(? AS REAL) WHERE id = ?`, [amount, toAccountId]);
  });
}
```

**Tip**: For investment/loan accounts you may want to keep `balance` as the cash portion only, and track holdings separately.

### 2. Recurring Transaction Scheduler

**Design**:
- Store recurring rule in `recurringRule` JSON (e.g. `{ frequency: 'monthly', interval: 1, dayOfMonth: 15, endDate: '2027-12-31' }`).
- On app start (or daily), run a **scheduler** that generates actual transactions for due recurring ones.
- Use `expo-task-manager` + `expo-background-fetch` for background execution (limited on iOS).
- Mark generated transactions with `isRecurring: true` and link back via `recurringRuleId` or original recurring transaction id (you can add a `recurringParentId` column if needed).

#### Add to `transactions` table (migration)
```sql
ALTER TABLE transactions ADD COLUMN recurringParentId TEXT;
```

#### Recurring Rule Type
```ts
export type RecurringRule = {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;           // every 1, 2, ...
  dayOfWeek?: number;         // 0-6 for weekly
  dayOfMonth?: number;        // 1-31 for monthly
  endDate?: string;           // ISO
  lastGeneratedDate?: string;
};
```

#### Scheduler Function (`recurringService.ts`)

```ts
import * as SQLite from 'expo-sqlite';
import { addDays, addMonths, addYears, isAfter, parseISO, formatISO } from 'date-fns'; // install date-fns

export async function processRecurringTransactions(db: SQLite.SQLiteDatabase) {
  const today = formatISO(new Date(), { representation: 'date' });

  // Find active recurring transactions that haven't been generated for today
  const recurringTxs = await db.getAllAsync<any>(`
    SELECT * FROM transactions 
    WHERE isRecurring = 1 
      AND (recurringRule IS NOT NULL)
      AND status = 'confirmed'
  `);

  for (const row of recurringTxs) {
    const rule: RecurringRule = JSON.parse(row.recurringRule);
    const lastGenerated = row.recurringRule.lastGeneratedDate 
      ? parseISO(row.recurringRule.lastGeneratedDate) 
      : parseISO(row.date);

    let nextDue = calculateNextDueDate(lastGenerated, rule);

    while (!isAfter(nextDue, new Date()) && 
           (!rule.endDate || !isAfter(nextDue, parseISO(rule.endDate)))) {

      // Generate new transaction
      const newTx = {
        ...row,
        id: undefined,
        date: formatISO(nextDue),
        isRecurring: false,
        recurringParentId: row.id,
        recurringRule: null,
        // copy other fields...
      };

      await createTransactionWithBalanceUpdate(db, newTx);

      // Update last generated
      rule.lastGeneratedDate = formatISO(nextDue);
      await db.runAsync(`
        UPDATE transactions 
        SET recurringRule = ?, updatedAt = datetime('now')
        WHERE id = ?
      `, [JSON.stringify(rule), row.id]);

      nextDue = calculateNextDueDate(nextDue, rule);
    }
  }
}

// Helper to calculate next due date
function calculateNextDueDate(current: Date, rule: RecurringRule): Date {
  let next = new Date(current);

  switch (rule.frequency) {
    case 'daily':
      next = addDays(next, rule.interval);
      break;
    case 'weekly':
      next = addDays(next, 7 * rule.interval);
      break;
    case 'monthly':
      next = addMonths(next, rule.interval);
      if (rule.dayOfMonth) {
        next.setDate(rule.dayOfMonth);
      }
      break;
    case 'yearly':
      next = addYears(next, rule.interval);
      break;
  }
  return next;
}
```

#### Running the Scheduler
- Call `processRecurringTransactions(db)` in `useEffect` on app launch (after DB open).
- For background: Register with `expo-background-fetch` or `expo-task-manager` (run daily).
- Show a "Generate pending recurring" button in UI for manual trigger.

**Example Background Task Setup** (add to `App.tsx` or dedicated file):
```ts
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

TaskManager.defineTask('RECURRING_TASK', async () => {
  const db = await getDB();
  await processRecurringTransactions(db);
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

await BackgroundFetch.registerTaskAsync('RECURRING_TASK', {
  minimumInterval: 60 * 60 * 24, // daily
  stopOnTerminate: false,
  startOnBoot: true,
});
```

Here's everything you requested in a clean, ready-to-use format for your React Native Expo + TypeScript + SQLite financial app.

### 1. Full Migration Script for Adding `recurringParentId`

Create a new file: `src/database/migrations/addRecurringParentId.ts`

```ts
import * as SQLite from 'expo-sqlite';

export async function migrateAddRecurringParentId(db: SQLite.SQLiteDatabase) {
  try {
    // Check if column already exists to make migration idempotent
    const result = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM pragma_table_info('transactions') WHERE name = 'recurringParentId';"
    );

    if (!result) {
      await db.execAsync(`
        ALTER TABLE transactions 
        ADD COLUMN recurringParentId TEXT;
      `);

      // Optional: Add index for better performance on recurring queries
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_transactions_recurringParentId 
        ON transactions(recurringParentId);
      `);

      console.log('✅ Migration: recurringParentId column added successfully');
    } else {
      console.log('✅ Migration: recurringParentId column already exists');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}
```

**How to run it** (call once on app startup after opening DB):

```ts
// In your database initialization
import { migrateAddRecurringParentId } from './migrations/addRecurringParentId';

const db = await getDB();
await migrateAddRecurringParentId(db);
```

### 2. UI Examples – Modal for Setting Recurring Rule

#### Type Definition (add to `types.ts`)
```ts
export type RecurringRule = {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;           // every 1, 2, 3...
  dayOfWeek?: number;         // 0 = Sunday, 1 = Monday, ..., 6 = Saturday (for weekly)
  dayOfMonth?: number;        // 1-31 (for monthly)
  endDate?: string;           // ISO date string
  lastGeneratedDate?: string;
};
```

#### Recurring Modal Component (`RecurringModal.tsx`)

```tsx
import React, { useState } from 'react';
import { View, Text, Modal, TextInput, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // or use your preferred picker
import DateTimePicker from '@react-native-community/datetimepicker';
import { RecurringRule } from './types';

interface RecurringModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (rule: RecurringRule | null) => void;
  initialRule?: RecurringRule | null;
}

export const RecurringModal: React.FC<RecurringModalProps> = ({
  visible,
  onClose,
  onSave,
  initialRule,
}) => {
  const [isRecurring, setIsRecurring] = useState(!!initialRule);
  const [rule, setRule] = useState<RecurringRule>(
    initialRule || {
      frequency: 'monthly',
      interval: 1,
      dayOfMonth: 15,
    }
  );
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleSave = () => {
    onSave(isRecurring ? rule : null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
          <Text className="text-2xl font-bold mb-6">Recurring Transaction</Text>

          <ScrollView>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-lg">Repeat this transaction</Text>
              <Switch value={isRecurring} onValueChange={setIsRecurring} />
            </View>

            {isRecurring && (
              <>
                <Text className="text-sm text-gray-500 mb-2">Frequency</Text>
                <Picker
                  selectedValue={rule.frequency}
                  onValueChange={(value) => setRule({ ...rule, frequency: value as any })}
                >
                  <Picker.Item label="Daily" value="daily" />
                  <Picker.Item label="Weekly" value="weekly" />
                  <Picker.Item label="Monthly" value="monthly" />
                  <Picker.Item label="Yearly" value="yearly" />
                </Picker>

                <Text className="text-sm text-gray-500 mt-4 mb-2">Every</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 mb-4"
                  keyboardType="numeric"
                  value={rule.interval.toString()}
                  onChangeText={(text) => setRule({ ...rule, interval: parseInt(text) || 1 })}
                />

                {rule.frequency === 'monthly' && (
                  <>
                    <Text className="text-sm text-gray-500 mb-2">Day of month</Text>
                    <TextInput
                      className="border border-gray-300 rounded-lg p-3 mb-4"
                      keyboardType="numeric"
                      value={rule.dayOfMonth?.toString() || ''}
                      onChangeText={(text) => setRule({ ...rule, dayOfMonth: parseInt(text) || 15 })}
                    />
                  </>
                )}

                <TouchableOpacity 
                  onPress={() => setShowEndDatePicker(true)}
                  className="border border-gray-300 rounded-lg p-4 mb-6"
                >
                  <Text>End Date: {rule.endDate ? rule.endDate.split('T')[0] : 'Never'}</Text>
                </TouchableOpacity>

                {showEndDatePicker && (
                  <DateTimePicker
                    value={rule.endDate ? new Date(rule.endDate) : new Date()}
                    mode="date"
                    onChange={(_, selectedDate) => {
                      setShowEndDatePicker(false);
                      if (selectedDate) {
                        setRule({ ...rule, endDate: selectedDate.toISOString() });
                      }
                    }}
                  />
                )}
              </>
            )}
          </ScrollView>

          <View className="flex-row gap-4 mt-8">
            <TouchableOpacity 
              onPress={onClose}
              className="flex-1 py-4 border border-gray-300 rounded-xl"
            >
              <Text className="text-center">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSave}
              className="flex-1 py-4 bg-blue-600 rounded-xl"
            >
              <Text className="text-white text-center font-semibold">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
```

**Usage** in your Transaction Form:
```tsx
<RecurringModal
  visible={showRecurringModal}
  onClose={() => setShowRecurringModal(false)}
  onSave={(rule) => setTransaction({ ...transaction, isRecurring: !!rule, recurringRule: rule })}
  initialRule={transaction.recurringRule}
/>
```

### 3. Net Worth / Portfolio Value Query

Add this helper to your `reportService.ts` or `transactionService.ts`:

```ts
export async function getNetWorth(db: SQLite.SQLiteDatabase): Promise<{
  totalNetWorth: number;
  accountBalances: number;
  investmentValue: number;     // estimated current value of holdings
}> {
  // 1. Sum of all account balances (bank, cash, crypto wallets, etc.)
  const accountResult = await db.getFirstAsync<{ total: number }>(`
    SELECT SUM(CAST(balance AS REAL)) as total 
    FROM accounts 
    WHERE isActive = 1;
  `);

  const accountBalances = accountResult?.total || 0;

  // 2. Investment holdings value (current estimation)
  // This assumes you fetch current prices separately (e.g., from API or cached)
  // For MVP you can store lastKnownPrice in details or have a separate holdings table

  const investmentTxs = await db.getAllAsync<any>(`
    SELECT t.details, t.currency, t.amountBase
    FROM transactions t
    WHERE t.type IN ('INVESTMENT_BUY', 'INVESTMENT_SELL')
      AND t.details IS NOT NULL;
  `);

  // Simple MVP version: sum realized + unrealized based on last transaction
  // Better long-term: maintain a holdings summary table updated on every investment transaction
  let investmentValue = 0;

  // Example placeholder logic – replace with your actual price fetching
  for (const tx of investmentTxs) {
    const details = JSON.parse(tx.details || '{}');
    if (details.quantity && details.symbol) {
      // investmentValue += details.quantity * currentPrice(details.symbol);
      // For now, you can approximate using amountBase or store last known value
    }
  }

  const totalNetWorth = accountBalances + investmentValue;

  return {
    totalNetWorth,
    accountBalances,
    investmentValue,
  };
}
```

**Recommended Future Improvement**: Create a `holdings` table that gets updated on every `INVESTMENT_BUY`/`SELL` for accurate portfolio tracking.

### 4. Complete `types.ts`

```ts
// src/types/finance.ts

export type TransactionType =
  | 'EXPENSE'
  | 'INCOME'
  | 'TRANSFER'
  | 'INVESTMENT_BUY'
  | 'INVESTMENT_SELL'
  | 'LOAN_RECEIVED'
  | 'LOAN_REPAYMENT'
  | 'DIVIDEND'
  | 'INTEREST'
  | 'CREDIT_CARD_PAYMENT';

export type AccountType =
  | 'bank'
  | 'crypto'
  | 'investment'
  | 'credit_card'
  | 'loan'
  | 'cash'
  | 'other';

export type RecurringRule = {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  dayOfWeek?: number;      // 0-6
  dayOfMonth?: number;     // 1-31
  endDate?: string;        // ISO string
  lastGeneratedDate?: string;
};

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;                    // ISO datetime
  amount: string;                  // original amount as string for precision
  currency: string;                // ISO 4217 or crypto symbol (BTC, ETH...)
  amountBase: string;              // converted to base currency
  baseCurrency: string;            // usually HUF
  exchangeRate: string;
  accountId: string | null;
  categoryId: string | null;
  description: string;
  source: string | null;           // merchant or client name
  tags: string[];
  notes: string | null;
  details: Record<string, any>;    // type-specific data (quantity, fees, loan info...)
  relatedTransactionId: string | null;
  isRecurring: boolean;
  recurringRule: RecurringRule | null;
  recurringParentId: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: string;
  isActive: boolean;
  icon?: string;
  color?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  transactionType: TransactionType | 'ALL'; // 'ALL' for shared categories if needed
  icon?: string;
  color?: string;
  isDefault: boolean;
  parentId?: string | null;
  createdAt: string;
}

export interface MonthlySummary {
  type: TransactionType;
  totalBase: number;
}

export interface NetWorth {
  totalNetWorth: number;
  accountBalances: number;
  investmentValue: number;
}
```

You now have all the missing pieces to continue development smoothly.


- The full `database.ts` initialization file with all table creations + migrations.
- Example seed data for categories and accounts.
Here's the complete, ready-to-use **`database.ts`** file with all table creations and migrations, plus **example seed data** for categories and accounts.

### 1. Full `database.ts` (src/database/database.ts)

```ts
import * as SQLite from 'expo-sqlite';
import { migrateAddRecurringParentId } from './migrations/addRecurringParentId';

export let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) return dbInstance;

  const db = await SQLite.openDatabaseAsync('flexfinance.db');

  // Enable WAL mode for better concurrent performance on mobile
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  await createTables(db);
  await runMigrations(db);

  dbInstance = db;
  return db;
};

async function createTables(db: SQLite.SQLiteDatabase) {
  // === ACCOUNTS TABLE ===
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS accounts (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL CHECK (type IN ('bank', 'crypto', 'investment', 'credit_card', 'loan', 'cash', 'other')),
      currency    TEXT NOT NULL,
      balance     TEXT NOT NULL DEFAULT '0',
      isActive    INTEGER NOT NULL DEFAULT 1,
      icon        TEXT,
      color       TEXT,
      notes       TEXT,
      createdAt   TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // === CATEGORIES TABLE ===
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id                TEXT PRIMARY KEY,
      name              TEXT NOT NULL,
      transactionType   TEXT NOT NULL,
      icon              TEXT,
      color             TEXT,
      isDefault         INTEGER NOT NULL DEFAULT 0,
      parentId          TEXT,
      createdAt         TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (parentId) REFERENCES categories(id) ON DELETE SET NULL
    );
  `);

  // === TRANSACTIONS TABLE ===
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id                  TEXT PRIMARY KEY,
      type                TEXT NOT NULL CHECK (type IN (
        'EXPENSE', 'INCOME', 'TRANSFER', 'INVESTMENT_BUY', 'INVESTMENT_SELL',
        'LOAN_RECEIVED', 'LOAN_REPAYMENT', 'DIVIDEND', 'INTEREST', 'CREDIT_CARD_PAYMENT'
      )),
      date                TEXT NOT NULL,
      amount              TEXT NOT NULL,
      currency            TEXT NOT NULL,
      amountBase          TEXT NOT NULL,
      baseCurrency        TEXT NOT NULL,
      exchangeRate        TEXT NOT NULL,
      accountId           TEXT,
      categoryId          TEXT,
      description         TEXT NOT NULL,
      source              TEXT,
      tags                TEXT NOT NULL DEFAULT '[]',
      notes               TEXT,
      details             TEXT NOT NULL DEFAULT '{}',
      relatedTransactionId TEXT,
      isRecurring         INTEGER NOT NULL DEFAULT 0,
      recurringRule       TEXT,
      recurringParentId   TEXT,
      status              TEXT NOT NULL DEFAULT 'confirmed',
      createdAt           TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt           TEXT NOT NULL DEFAULT (datetime('now')),

      FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE SET NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (relatedTransactionId) REFERENCES transactions(id) ON DELETE SET NULL,
      FOREIGN KEY (recurringParentId) REFERENCES transactions(id) ON DELETE SET NULL
    );
  `);

  // Indexes for performance
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(accountId);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(categoryId);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_transactions_recurringParentId ON transactions(recurringParentId);`);
}

async function runMigrations(db: SQLite.SQLiteDatabase) {
  try {
    await migrateAddRecurringParentId(db);
    // Add future migrations here
    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

// Optional: Close database (useful for testing)
export const closeDB = async () => {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
};
```

### 2. Example Seed Data (seedData.ts)

Create a new file: `src/database/seedData.ts`

```ts
import * as SQLite from 'expo-sqlite';
import { getDB } from './database';

export async function seedInitialData() {
  const db = await getDB();

  try {
    // Check if data already exists
    const existingAccounts = await db.getFirstAsync('SELECT COUNT(*) as count FROM accounts');
    if (existingAccounts && (existingAccounts as any).count > 0) {
      console.log('✅ Seed data already exists. Skipping...');
      return;
    }

    console.log('🌱 Seeding initial data...');

    await db.withTransactionAsync(async () => {
      // === SEED ACCOUNTS ===
      const accounts = [
        {
          id: 'acc_otp_huf',
          name: 'OTP Bank HUF',
          type: 'bank',
          currency: 'HUF',
          balance: '2450000',
          icon: '🏦',
          color: '#0066CC',
          notes: 'Main salary account',
        },
        {
          id: 'acc_wise_usd',
          name: 'Wise USD',
          type: 'bank',
          currency: 'USD',
          balance: '1240.50',
          icon: '🌍',
          color: '#00CC88',
          notes: 'International payments',
        },
        {
          id: 'acc_binance',
          name: 'Binance Wallet',
          type: 'crypto',
          currency: 'BTC',
          balance: '0.0842',
          icon: '₿',
          color: '#F7931A',
          notes: 'Crypto investments',
        },
        {
          id: 'acc_revolut_eur',
          name: 'Revolut EUR',
          type: 'bank',
          currency: 'EUR',
          balance: '890.75',
          icon: '💶',
          color: '#0066FF',
        },
        {
          id: 'acc_loan_personal',
          name: 'Personal Loan',
          type: 'loan',
          currency: 'HUF',
          balance: '-1250000', // negative = debt
          icon: '🏦',
          color: '#FF4444',
          notes: 'Bank personal loan',
        },
        {
          id: 'acc_cash',
          name: 'Cash Wallet',
          type: 'cash',
          currency: 'HUF',
          balance: '45000',
          icon: '💵',
          color: '#00AA00',
        },
      ];

      for (const acc of accounts) {
        await db.runAsync(`
          INSERT OR IGNORE INTO accounts (id, name, type, currency, balance, icon, color, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [acc.id, acc.name, acc.type, acc.currency, acc.balance, acc.icon, acc.color, acc.notes || null]);
      }

      // === SEED CATEGORIES ===
      const categories = [
        // EXPENSE categories
        { id: 'cat_food', name: 'Food & Groceries', transactionType: 'EXPENSE', icon: '🛒', color: '#FF9800', isDefault: 1 },
        { id: 'cat_transport', name: 'Transportation', transactionType: 'EXPENSE', icon: '🚕', color: '#2196F3', isDefault: 1 },
        { id: 'cat_housing', name: 'Housing & Rent', transactionType: 'EXPENSE', icon: '🏠', color: '#9C27B0', isDefault: 1 },
        { id: 'cat_books', name: 'Books & Education', transactionType: 'EXPENSE', icon: '📚', color: '#4CAF50', isDefault: 1 },
        { id: 'cat_entertainment', name: 'Entertainment', transactionType: 'EXPENSE', icon: '🎮', color: '#E91E63', isDefault: 1 },
        { id: 'cat_utilities', name: 'Utilities', transactionType: 'EXPENSE', icon: '💡', color: '#FF5722', isDefault: 1 },
        { id: 'cat_shopping', name: 'Shopping', transactionType: 'EXPENSE', icon: '🛍️', color: '#795548', isDefault: 1 },

        // INCOME categories
        { id: 'cat_salary', name: 'Salary', transactionType: 'INCOME', icon: '💼', color: '#4CAF50', isDefault: 1 },
        { id: 'cat_freelance', name: 'Freelance / Contracting', transactionType: 'INCOME', icon: '💻', color: '#2196F3', isDefault: 1 },
        { id: 'cat_dividend', name: 'Dividends', transactionType: 'INCOME', icon: '📈', color: '#FF9800', isDefault: 1 },
        { id: 'cat_interest', name: 'Interest', transactionType: 'INCOME', icon: '🏦', color: '#00BCD4', isDefault: 1 },

        // INVESTMENT categories
        { id: 'cat_crypto', name: 'Cryptocurrency', transactionType: 'INVESTMENT_BUY', icon: '₿', color: '#F7931A', isDefault: 1 },
        { id: 'cat_stocks', name: 'Stocks & ETFs', transactionType: 'INVESTMENT_BUY', icon: '📊', color: '#3F51B5', isDefault: 1 },

        // LOAN categories
        { id: 'cat_loan_repayment', name: 'Loan Repayment', transactionType: 'LOAN_REPAYMENT', icon: '💰', color: '#F44336', isDefault: 1 },
      ];

      for (const cat of categories) {
        await db.runAsync(`
          INSERT OR IGNORE INTO categories (id, name, transactionType, icon, color, isDefault)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [cat.id, cat.name, cat.transactionType, cat.icon, cat.color, cat.isDefault]);
      }
    });

    console.log('✅ Seed data inserted successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}
```

### How to Use

In your `App.tsx` or root component:

```tsx
import { getDB } from './database/database';
import { seedInitialData } from './database/seedData';

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      const db = await getDB();
      await seedInitialData();           // Run only once on first launch
    };

    initializeApp();
  }, []);

  // ... rest of your app
}
```

You now have a complete, robust database initialization with proper migrations and useful seed data.

A full types.ts update with the new recurringParentId field
Helper functions to reset and re-seed the database during development
Full transaction form with recurring modal

Here's everything you requested — clean, complete, and ready to integrate into your React Native Expo + TypeScript + SQLite financial app.

---

### 1. Updated `types.ts` (with `recurringParentId`)

**File:** `src/types/finance.ts`

```ts
// src/types/finance.ts

export type TransactionType =
  | 'EXPENSE'
  | 'INCOME'
  | 'TRANSFER'
  | 'INVESTMENT_BUY'
  | 'INVESTMENT_SELL'
  | 'LOAN_RECEIVED'
  | 'LOAN_REPAYMENT'
  | 'DIVIDEND'
  | 'INTEREST'
  | 'CREDIT_CARD_PAYMENT';

export type AccountType =
  | 'bank'
  | 'crypto'
  | 'investment'
  | 'credit_card'
  | 'loan'
  | 'cash'
  | 'other';

export type RecurringRule = {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;           // e.g., every 1, 2, ...
  dayOfWeek?: number;         // 0-6 (Sunday = 0)
  dayOfMonth?: number;        // 1-31 for monthly
  endDate?: string;           // ISO date string
  lastGeneratedDate?: string;
};

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;                    // ISO datetime string
  amount: string;                  // Original amount (string for precision)
  currency: string;                // ISO 4217 or crypto symbol (e.g., "USD", "BTC")
  amountBase: string;              // Converted to base currency
  baseCurrency: string;            // Usually "HUF"
  exchangeRate: string;
  accountId: string | null;
  categoryId: string | null;
  description: string;
  source: string | null;           // Merchant or client name
  tags: string[];
  notes: string | null;
  details: Record<string, any>;    // Type-specific data (quantity, fees, loan info, etc.)
  relatedTransactionId: string | null;
  isRecurring: boolean;
  recurringRule: RecurringRule | null;
  recurringParentId: string | null;   // ← New field
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: string;
  isActive: boolean;
  icon?: string;
  color?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  transactionType: TransactionType;
  icon?: string;
  color?: string;
  isDefault: boolean;
  parentId?: string | null;
  createdAt: string;
}

export interface MonthlySummary {
  type: TransactionType;
  totalBase: number;
}

export interface NetWorth {
  totalNetWorth: number;
  accountBalances: number;
  investmentValue: number;
}
```

---

### 2. Helper Functions to Reset and Re-seed Database (Development)

**File:** `src/database/devTools.ts`

```ts
import * as SQLite from 'expo-sqlite';
import { getDB } from './database';
import { seedInitialData } from './seedData';

export async function resetAndSeedDatabase(): Promise<void> {
  console.log('🔄 Resetting and re-seeding database...');

  const db = await getDB();

  try {
    await db.withTransactionAsync(async () => {
      // Drop existing data
      await db.execAsync('DELETE FROM transactions;');
      await db.execAsync('DELETE FROM accounts;');
      await db.execAsync('DELETE FROM categories;');

      // Reset auto-increment / sqlite_sequence if needed
      await db.execAsync("DELETE FROM sqlite_sequence WHERE name IN ('transactions', 'accounts', 'categories');");
    });

    console.log('✅ Tables cleared successfully');

    // Re-seed data
    await seedInitialData();

    console.log('🎉 Database reset and seeded successfully!');
  } catch (error) {
    console.error('❌ Failed to reset and seed database:', error);
    throw error;
  }
}

// Quick reset without re-seeding (useful for testing)
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM transactions;');
    await db.execAsync('DELETE FROM accounts;');
    await db.execAsync('DELETE FROM categories;');
  });
  console.log('🗑️ All data cleared');
}

// Development helper to log current DB stats
export async function logDatabaseStats() {
  const db = await getDB();

  const txCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM transactions');
  const accCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM accounts');
  const catCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories');

  console.log('📊 Database Stats:');
  console.log(`   Transactions: ${txCount?.count || 0}`);
  console.log(`   Accounts: ${accCount?.count || 0}`);
  console.log(`   Categories: ${catCount?.count || 0}`);
}
```

**Usage in development** (e.g., add a debug button or call in `useEffect` with a dev flag):

```tsx
import { resetAndSeedDatabase, logDatabaseStats } from './database/devTools';

// Example: Add this button in a debug screen
<Button title="Reset & Re-seed DB" onPress={resetAndSeedDatabase} color="red" />
```

---

### 3. Full Transaction Form with Recurring Modal

**File:** `src/components/TransactionForm.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDB } from '../database/database';
import { createTransactionWithBalanceUpdate } from '../services/transactionService';
import { RecurringModal } from './RecurringModal';
import { Transaction, TransactionType, RecurringRule } from '../types/finance';

interface TransactionFormProps {
  onSuccess?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess }) => {
  const [transaction, setTransaction] = useState<Partial<Transaction>>({
    type: 'EXPENSE',
    date: new Date().toISOString(),
    amount: '',
    currency: 'HUF',
    description: '',
    source: '',
    tags: [],
    notes: '',
    details: {},
    isRecurring: false,
    recurringRule: null,
    status: 'confirmed',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!transaction.amount || !transaction.description || !transaction.accountId) {
      Alert.alert('Error', 'Please fill amount, description and account');
      return;
    }

    setLoading(true);

    try {
      const db = await getDB();

      // For simplicity in MVP: assume baseCurrency = 'HUF' and exchangeRate = '1' when same currency
      const amountBase = transaction.currency === 'HUF'
        ? transaction.amount
        : (parseFloat(transaction.amount) * 380).toFixed(2); // placeholder rate

      const newTx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
        type: transaction.type as TransactionType,
        date: transaction.date!,
        amount: transaction.amount,
        currency: transaction.currency!,
        amountBase,
        baseCurrency: 'HUF',
        exchangeRate: transaction.currency === 'HUF' ? '1' : '380',
        accountId: transaction.accountId!,
        categoryId: transaction.categoryId || null,
        description: transaction.description!,
        source: transaction.source || null,
        tags: transaction.tags || [],
        notes: transaction.notes || null,
        details: transaction.details || {},
        relatedTransactionId: null,
        isRecurring: transaction.isRecurring || false,
        recurringRule: transaction.recurringRule,
        recurringParentId: null,
        status: 'confirmed',
      };

      await createTransactionWithBalanceUpdate(db, newTx);

      Alert.alert('Success', 'Transaction saved successfully!');
      setTransaction({ ...transaction, amount: '', description: '', source: '', notes: '' }); // reset form
      onSuccess?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to save transaction');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 p-4 bg-gray-50">
      <Text className="text-2xl font-bold mb-6">New Transaction</Text>

      {/* Transaction Type */}
      <Text className="text-sm text-gray-500 mb-1">Type</Text>
      <Picker
        selectedValue={transaction.type}
        onValueChange={(value) => setTransaction({ ...transaction, type: value as TransactionType })}
      >
        <Picker.Item label="Expense" value="EXPENSE" />
        <Picker.Item label="Income" value="INCOME" />
        <Picker.Item label="Investment Buy" value="INVESTMENT_BUY" />
        <Picker.Item label="Investment Sell" value="INVESTMENT_SELL" />
        <Picker.Item label="Loan Received" value="LOAN_RECEIVED" />
        <Picker.Item label="Loan Repayment" value="LOAN_REPAYMENT" />
      </Picker>

      {/* Date */}
      <TouchableOpacity onPress={() => setShowDatePicker(true)} className="mt-4">
        <Text className="text-sm text-gray-500 mb-1">Date</Text>
        <View className="border border-gray-300 rounded-lg p-4">
          <Text>{new Date(transaction.date!).toLocaleDateString()}</Text>
        </View>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={new Date(transaction.date!)}
          mode="date"
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setTransaction({ ...transaction, date: selectedDate.toISOString() });
            }
          }}
        />
      )}

      {/* Amount & Currency */}
      <View className="flex-row gap-3 mt-4">
        <View className="flex-1">
          <Text className="text-sm text-gray-500 mb-1">Amount</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-4"
            keyboardType="decimal-pad"
            value={transaction.amount}
            onChangeText={(text) => setTransaction({ ...transaction, amount: text })}
            placeholder="0.00"
          />
        </View>
        <View className="flex-1">
          <Text className="text-sm text-gray-500 mb-1">Currency</Text>
          <Picker
            selectedValue={transaction.currency}
            onValueChange={(value) => setTransaction({ ...transaction, currency: value })}
          >
            <Picker.Item label="HUF" value="HUF" />
            <Picker.Item label="USD" value="USD" />
            <Picker.Item label="EUR" value="EUR" />
            <Picker.Item label="BTC" value="BTC" />
          </Picker>
        </View>
      </View>

      {/* Account */}
      <Text className="text-sm text-gray-500 mt-4 mb-1">Account</Text>
      <Picker
        selectedValue={transaction.accountId}
        onValueChange={(value) => setTransaction({ ...transaction, accountId: value })}
      >
        <Picker.Item label="Select Account" value="" />
        {/* Populate dynamically in real app using getAccounts() */}
        <Picker.Item label="OTP Bank HUF" value="acc_otp_huf" />
        <Picker.Item label="Wise USD" value="acc_wise_usd" />
        <Picker.Item label="Binance" value="acc_binance" />
      </Picker>

      {/* Description */}
      <Text className="text-sm text-gray-500 mt-4 mb-1">Description</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-4"
        value={transaction.description}
        onChangeText={(text) => setTransaction({ ...transaction, description: text })}
        placeholder="e.g. Amazon book purchase"
      />

      {/* Source / Merchant */}
      <Text className="text-sm text-gray-500 mt-4 mb-1">Source / Merchant</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-4"
        value={transaction.source || ''}
        onChangeText={(text) => setTransaction({ ...transaction, source: text })}
        placeholder="Amazon.com or Client XYZ"
      />

      {/* Notes */}
      <Text className="text-sm text-gray-500 mt-4 mb-1">Notes</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-4 h-20"
        multiline
        value={transaction.notes || ''}
        onChangeText={(text) => setTransaction({ ...transaction, notes: text })}
        placeholder="Additional details..."
      />

      {/* Recurring Button */}
      <TouchableOpacity
        onPress={() => setShowRecurringModal(true)}
        className="mt-6 py-4 border border-dashed border-blue-500 rounded-xl"
      >
        <Text className="text-center text-blue-600 font-medium">
          {transaction.isRecurring ? '🔁 Edit Recurring Rule' : '🔁 Make this Recurring'}
        </Text>
      </TouchableOpacity>

      {/* Save Button */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={loading}
        className={`mt-8 py-5 rounded-2xl ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}
      >
        <Text className="text-white text-center text-lg font-semibold">
          {loading ? 'Saving...' : 'Save Transaction'}
        </Text>
      </TouchableOpacity>

      {/* Recurring Modal */}
      <RecurringModal
        visible={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        onSave={(rule) => {
          setTransaction({
            ...transaction,
            isRecurring: !!rule,
            recurringRule: rule,
          });
        }}
        initialRule={transaction.recurringRule}
      />
    </ScrollView>
  );
};
```

---

You now have:

- Complete updated `types.ts`
- Development reset & seed helpers
- Full-featured Transaction Form with integrated Recurring Modal

Here are 
the matching `transactionService.ts` (with `createTransactionWithBalanceUpdate`), 
the `RecurringModal` component code, 
 the next major piece:  the Dashboard and  the Transaction List screen

---

### 1. `transactionService.ts` (with `createTransactionWithBalanceUpdate`)

**File:** `src/services/transactionService.ts`

```ts
import * as SQLite from 'expo-sqlite';
import { Transaction, TransactionType, RecurringRule } from '../types/finance';

function getBalanceDelta(type: TransactionType, amount: string): string {
  const numAmount = parseFloat(amount) || 0;

  switch (type) {
    case 'INCOME':
    case 'LOAN_RECEIVED':
    case 'DIVIDEND':
    case 'INTEREST':
      return numAmount.toFixed(2);                    // Money in

    case 'EXPENSE':
    case 'LOAN_REPAYMENT':
    case 'CREDIT_CARD_PAYMENT':
      return (-numAmount).toFixed(2);                 // Money out

    case 'INVESTMENT_BUY':
      return (-numAmount).toFixed(2);                 // Cash leaves account

    case 'INVESTMENT_SELL':
      return numAmount.toFixed(2);                    // Cash enters account

    case 'TRANSFER':
      return '0';                                     // Handled separately

    default:
      return '0';
  }
}

export async function createTransactionWithBalanceUpdate(
  db: SQLite.SQLiteDatabase,
  tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Transaction> {
  const id = `tr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const delta = getBalanceDelta(tx.type, tx.amount);

  await db.withTransactionAsync(async () => {
    // 1. Insert transaction
    await db.runAsync(`
      INSERT INTO transactions (
        id, type, date, amount, currency, amountBase, baseCurrency, exchangeRate,
        accountId, categoryId, description, source, tags, notes, details,
        relatedTransactionId, isRecurring, recurringRule, recurringParentId, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      tx.type,
      tx.date,
      tx.amount,
      tx.currency,
      tx.amountBase,
      tx.baseCurrency,
      tx.exchangeRate,
      tx.accountId,
      tx.categoryId,
      tx.description,
      tx.source,
      JSON.stringify(tx.tags || []),
      tx.notes || null,
      JSON.stringify(tx.details || {}),
      tx.relatedTransactionId || null,
      tx.isRecurring ? 1 : 0,
      tx.recurringRule ? JSON.stringify(tx.recurringRule) : null,
      tx.recurringParentId || null,
      tx.status || 'confirmed'
    ]);

    // 2. Update account balance if applicable
    if (tx.accountId && delta !== '0') {
      await db.runAsync(`
        UPDATE accounts 
        SET balance = (CAST(balance AS REAL) + CAST(? AS REAL)),
            updatedAt = datetime('now')
        WHERE id = ?
      `, [delta, tx.accountId]);
    }
  });

  return {
    ...tx,
    id,
    createdAt: now,
    updatedAt: now,
  } as Transaction;
}

// Get transactions with optional filters
export async function getTransactions(
  db: SQLite.SQLiteDatabase,
  filters: {
    type?: TransactionType;
    startDate?: string;
    endDate?: string;
    accountId?: string;
    limit?: number;
  } = {}
): Promise<Transaction[]> {
  let sql = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (filters.type) {
    sql += ' AND type = ?';
    params.push(filters.type);
  }
  if (filters.startDate) {
    sql += ' AND date >= ?';
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    sql += ' AND date <= ?';
    params.push(filters.endDate);
  }
  if (filters.accountId) {
    sql += ' AND accountId = ?';
    params.push(filters.accountId);
  }

  sql += ' ORDER BY date DESC';

  if (filters.limit) {
    sql += ' LIMIT ?';
    params.push(filters.limit);
  }

  const rows = await db.getAllAsync<any>(sql, params);

  return rows.map((row) => ({
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    details: JSON.parse(row.details || '{}'),
    recurringRule: row.recurringRule ? JSON.parse(row.recurringRule) : null,
    isRecurring: !!row.isRecurring,
  }));
}

// Monthly summary (for dashboard)
export async function getMonthlySummary(db: SQLite.SQLiteDatabase, yearMonth: string) {
  const sql = `
    SELECT type, SUM(CAST(amountBase AS REAL)) as totalBase
    FROM transactions 
    WHERE date LIKE ? 
    GROUP BY type
  `;
  return db.getAllAsync(sql, [`${yearMonth}%`]);
}
```

---

### 2. `RecurringModal` Component

**File:** `src/components/RecurringModal.tsx`

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RecurringRule } from '../types/finance';

interface RecurringModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (rule: RecurringRule | null) => void;
  initialRule?: RecurringRule | null;
}

export const RecurringModal: React.FC<RecurringModalProps> = ({
  visible,
  onClose,
  onSave,
  initialRule,
}) => {
  const [isRecurringEnabled, setIsRecurringEnabled] = useState(!!initialRule);
  const [rule, setRule] = useState<RecurringRule>(
    initialRule || {
      frequency: 'monthly',
      interval: 1,
      dayOfMonth: 15,
    }
  );
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleSave = () => {
    onSave(isRecurringEnabled ? rule : null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
          <Text className="text-2xl font-bold mb-6">Recurring Transaction</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center justify-between mb-6 p-2">
              <Text className="text-lg font-medium">Repeat automatically</Text>
              <Switch
                value={isRecurringEnabled}
                onValueChange={setIsRecurringEnabled}
              />
            </View>

            {isRecurringEnabled && (
              <>
                <Text className="text-sm text-gray-500 mb-2">Frequency</Text>
                <View className="border border-gray-300 rounded-xl overflow-hidden mb-4">
                  <Picker
                    selectedValue={rule.frequency}
                    onValueChange={(val) =>
                      setRule({ ...rule, frequency: val as any })
                    }
                  >
                    <Picker.Item label="Daily" value="daily" />
                    <Picker.Item label="Weekly" value="weekly" />
                    <Picker.Item label="Monthly" value="monthly" />
                    <Picker.Item label="Yearly" value="yearly" />
                  </Picker>
                </View>

                <Text className="text-sm text-gray-500 mb-2">Every (interval)</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl p-4 mb-4 text-lg"
                  keyboardType="numeric"
                  value={rule.interval.toString()}
                  onChangeText={(text) =>
                    setRule({ ...rule, interval: parseInt(text) || 1 })
                  }
                />

                {rule.frequency === 'monthly' && (
                  <>
                    <Text className="text-sm text-gray-500 mb-2">Day of the month</Text>
                    <TextInput
                      className="border border-gray-300 rounded-xl p-4 mb-6 text-lg"
                      keyboardType="numeric"
                      value={rule.dayOfMonth?.toString() || '15'}
                      onChangeText={(text) =>
                        setRule({ ...rule, dayOfMonth: parseInt(text) || 15 })
                      }
                    />
                  </>
                )}

                <TouchableOpacity
                  onPress={() => setShowEndDatePicker(true)}
                  className="border border-gray-300 rounded-xl p-4 mb-6"
                >
                  <Text className="text-base">
                    End Date: {rule.endDate ? new Date(rule.endDate).toLocaleDateString() : 'Never'}
                  </Text>
                </TouchableOpacity>

                {showEndDatePicker && (
                  <DateTimePicker
                    value={rule.endDate ? new Date(rule.endDate) : new Date()}
                    mode="date"
                    onChange={(_, date) => {
                      setShowEndDatePicker(false);
                      if (date) {
                        setRule({ ...rule, endDate: date.toISOString() });
                      }
                    }}
                  />
                )}
              </>
            )}
          </ScrollView>

          <View className="flex-row gap-4 mt-8">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-4 border border-gray-400 rounded-2xl"
            >
              <Text className="text-center text-lg">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 py-4 bg-blue-600 rounded-2xl"
            >
              <Text className="text-white text-center text-lg font-semibold">Save Rule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
```

---

### 3. Dashboard + Transaction List Screen (Next Major Piece)

**File:** `src/screens/DashboardScreen.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { getDB } from '../database/database';
import { getTransactions, getMonthlySummary } from '../services/transactionService';
import { getNetWorth } from '../services/reportService'; // we'll create this next if needed
import { Transaction } from '../types/finance';
import { TransactionForm } from '../components/TransactionForm';
import { format } from 'date-fns';

export default function DashboardScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [netWorth, setNetWorth] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const currentMonth = format(new Date(), 'yyyy-MM');

  const loadDashboard = async () => {
    const db = await getDB();

    // Recent transactions (last 10)
    const recentTxs = await getTransactions(db, { limit: 10 });
    setTransactions(recentTxs);

    // Monthly summary
    const summary = await getMonthlySummary(db, currentMonth);
    const income = summary.find((s: any) => s.type === 'INCOME')?.totalBase || 0;
    const expense = summary.find((s: any) => s.type === 'EXPENSE')?.totalBase || 0;

    setMonthlyIncome(Math.abs(income));
    setMonthlyExpense(Math.abs(expense));

    // Net worth (placeholder - expand later)
    const worth = await getNetWorth(db); // implement in reportService.ts
    setNetWorth(worth.totalNetWorth);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-blue-600 pt-12 pb-8 px-6">
          <Text className="text-white text-3xl font-bold">FlexFinance</Text>
          <Text className="text-blue-100 mt-1">April 2026 Overview</Text>
        </View>

        {/* Net Worth Card */}
        <View className="mx-4 -mt-6 bg-white rounded-3xl p-6 shadow-sm">
          <Text className="text-gray-500 text-sm">Net Worth</Text>
          <Text className="text-4xl font-bold mt-2">{Number(netWorth).toLocaleString()} HUF</Text>
        </View>

        {/* Monthly Summary */}
        <View className="flex-row justify-between mx-4 mt-8 px-2">
          <View className="bg-white p-5 rounded-2xl flex-1 mr-3">
            <Text className="text-green-600 font-medium">Income</Text>
            <Text className="text-2xl font-bold mt-2">+{monthlyIncome.toLocaleString()} HUF</Text>
          </View>
          <View className="bg-white p-5 rounded-2xl flex-1 ml-3">
            <Text className="text-red-600 font-medium">Expense</Text>
            <Text className="text-2xl font-bold mt-2">-{monthlyExpense.toLocaleString()} HUF</Text>
          </View>
        </View>

        {/* Quick Add Button */}
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          className="mx-4 mt-8 bg-blue-600 py-5 rounded-2xl"
        >
          <Text className="text-white text-center text-xl font-semibold">+ New Transaction</Text>
        </TouchableOpacity>

        {/* Recent Transactions */}
        <View className="mx-4 mt-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-semibold">Recent Activity</Text>
            <TouchableOpacity>
              <Text className="text-blue-600">See all</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <Text className="text-gray-400 text-center py-10">No transactions yet</Text>
          ) : (
            transactions.map((tx) => (
              <View key={tx.id} className="bg-white p-4 rounded-2xl mb-3 flex-row justify-between items-center">
                <View>
                  <Text className="font-medium">{tx.description}</Text>
                  <Text className="text-xs text-gray-500">{tx.source || tx.currency}</Text>
                </View>
                <View className="items-end">
                  <Text className={tx.type.includes('INCOME') || tx.type.includes('SELL') ? 'text-green-600' : 'text-red-600'}>
                    {tx.type.includes('INCOME') || tx.type.includes('SELL') ? '+' : ''}
                    {Number(tx.amountBase).toLocaleString()} HUF
                  </Text>
                  <Text className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Transaction Form Modal */}
      <TransactionForm
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={() => {
          setShowForm(false);
          loadDashboard();
        }}
      />
    </View>
  );
}
```

**Note:** The code above assumes you have a `TransactionForm` wrapped in a modal. You can adjust it to use a full screen or bottom sheet as needed.

Here are:
- The `reportService.ts` with full `getNetWorth` implementation
- A dedicated `TransactionListScreen.tsx` with filters and search


Here's the complete, ready-to-use code for the **Account Management Screen** and the **React Navigation bottom tabs setup**, perfectly integrated with everything we've built so far.

---

### 1. Account Management Screen

**File:** `src/screens/AccountsScreen.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { getDB } from '../database/database';
import { Ionicons } from '@expo/vector-icons';

interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: string;
  icon?: string;
  color?: string;
  notes?: string;
}

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);

  const loadAccounts = async () => {
    try {
      const db = await getDB();
      
      const result = await db.getAllAsync<Account>(`
        SELECT * FROM accounts 
        WHERE isActive = 1 
        ORDER BY type, name
      `);

      setAccounts(result);

      // Calculate total balance in base currency (HUF)
      const total = result.reduce((sum, acc) => {
        return sum + parseFloat(acc.balance || '0');
      }, 0);

      setTotalBalance(total);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      Alert.alert('Error', 'Could not load accounts');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccounts();
    setRefreshing(false);
  };

  const deleteAccount = async (id: string, name: string) => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDB();
              await db.runAsync('UPDATE accounts SET isActive = 0 WHERE id = ?', [id]);
              await loadAccounts();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank': return '🏦';
      case 'crypto': return '₿';
      case 'investment': return '📈';
      case 'credit_card': return '💳';
      case 'loan': return '🏦';
      case 'cash': return '💵';
      default: return '💰';
    }
  };

  const renderAccount = ({ item }: { item: Account }) => {
    const balanceNum = parseFloat(item.balance || '0');
    const isNegative = balanceNum < 0;

    return (
      <View className="bg-white mx-4 mb-3 p-5 rounded-3xl shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-3xl mr-4">{item.icon || getAccountIcon(item.type)}</Text>
            <View>
              <Text className="font-semibold text-lg">{item.name}</Text>
              <Text className="text-gray-500 text-sm">
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {item.currency}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => deleteAccount(item.id, item.name)}>
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View className="mt-6 pt-4 border-t border-gray-100">
          <Text className="text-gray-500 text-sm">Balance</Text>
          <Text className={`text-3xl font-bold mt-1 ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
            {balanceNum.toLocaleString()} {item.currency}
          </Text>
        </View>

        {item.notes && (
          <Text className="text-gray-500 text-sm mt-3">{item.notes}</Text>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-12 pb-6 px-6 border-b border-gray-100">
        <Text className="text-3xl font-bold">Accounts</Text>
        <Text className="text-gray-500 mt-1">Manage your money sources</Text>
      </View>

      {/* Total Balance Card */}
      <View className="mx-4 -mt-4 bg-blue-600 rounded-3xl p-6 shadow">
        <Text className="text-blue-100 text-sm font-medium">TOTAL NET BALANCE</Text>
        <Text className="text-white text-4xl font-bold mt-2">
          {totalBalance.toLocaleString()} HUF
        </Text>
      </View>

      {/* Accounts List */}
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={renderAccount}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-400 text-lg">No accounts yet</Text>
          </View>
        }
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
      />

      {/* Floating Add Button */}
      <TouchableOpacity 
        className="absolute bottom-8 right-6 bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-lg"
        onPress={() => Alert.alert('Coming Soon', 'Account creation form will be added in the next update')}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}
```

---

### 2. Navigation Setup with React Navigation Bottom Tabs

**File:** `src/navigation/AppNavigator.tsx`

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import TransactionListScreen from '../screens/TransactionListScreen';
import AccountsScreen from '../screens/AccountsScreen';
// import ReportsScreen from '../screens/ReportsScreen'; // You can create this later

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            switch (route.name) {
              case 'Dashboard':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'Transactions':
                iconName = focused ? 'list' : 'list-outline';
                break;
              case 'Accounts':
                iconName = focused ? 'wallet' : 'wallet-outline';
                break;
              case 'Reports':
                iconName = focused ? 'bar-chart' : 'bar-chart-outline';
                break;
              default:
                iconName = 'help-circle-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerShown: false, // We handle headers inside each screen
        })}
      >
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardScreen} 
        />
        
        <Tab.Screen 
          name="Transactions" 
          component={TransactionListScreen} 
        />
        
        <Tab.Screen 
          name="Accounts" 
          component={AccountsScreen} 
        />
        
        <Tab.Screen 
          name="Reports" 
          component={ReportsScreenPlaceholder} // Replace with real screen later
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// Temporary placeholder for Reports screen
function ReportsScreenPlaceholder() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <Text className="text-2xl font-semibold text-gray-400">Reports Screen</Text>
      <Text className="text-gray-500 mt-2">Coming soon with charts and insights</Text>
    </View>
  );
}
```

### How to Use in `App.tsx`

**File:** `App.tsx`

```tsx
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { getDB } from './src/database/database';
import { seedInitialData } from './src/database/seedData';

export default function App() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await getDB();           // Initialize database + tables + migrations
        await seedInitialData(); // Seed default accounts & categories
      } catch (error) {
        console.error('App initialization failed:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <AppNavigator />
    </>
  );
}
```

---

You now have a fully functional navigation structure with:

- Clean bottom tab navigation
- Dashboard, Transactions, and Accounts screens fully connected
- Consistent styling and UX
- Proper database initialization on app start

Add a floating action button on Dashboard/Transactions for quick transaction entry
Implement the Reports screen with charts
Add account creation form

### 1. Floating Action Button for Quick Transaction Entry

I’ve added a reusable **Floating Action Button (FAB)** that appears on **Dashboard** and **Transactions** screens. It opens the transaction form in a modal.

#### Updated `TransactionForm.tsx` (make it a modal component)

Add this wrapper if you haven’t already:

```tsx
// src/components/TransactionFormModal.tsx
import React, { useState } from 'react';
import { Modal, View } from 'react-native';
import { TransactionForm } from './TransactionForm'; // the scrollable form we had earlier

interface TransactionFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <TransactionForm onSuccess={() => {
        onSuccess?.();
        onClose();
      }} />
    </Modal>
  );
};
```

#### Add FAB to `DashboardScreen.tsx` and `TransactionListScreen.tsx`

Add this import and FAB component at the bottom of both screens:

```tsx
// Inside both DashboardScreen and TransactionListScreen
import { TransactionFormModal } from '../components/TransactionFormModal';

const [showTransactionModal, setShowTransactionModal] = useState(false);

// ... inside the return JSX, before the closing </View>

{/* Floating Action Button */}
<TransactionFormModal
  visible={showTransactionModal}
  onClose={() => setShowTransactionModal(false)}
  onSuccess={loadDashboard} // or loadTransactions on TransactionListScreen
/>

<TouchableOpacity
  onPress={() => setShowTransactionModal(true)}
  className="absolute bottom-8 right-6 bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-2xl z-50"
  style={{
    elevation: 8,           // Android shadow
    shadowColor: '#000',    // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  }}
>
  <Ionicons name="add" size={32} color="white" />
</TouchableOpacity>
```

Place the FAB **outside** the `ScrollView`/`FlatList` so it stays fixed.

**Tip**: For a more advanced centered FAB in the tab bar, you can later customize the tab navigator with a custom tab bar, but this absolute-positioned FAB is simple and effective.

### 2. Reports Screen with Charts

First, install the chart library (if not already):

```bash
npx expo install react-native-chart-kit react-native-svg
```

#### `ReportsScreen.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { getDB } from '../database/database';
import { getMonthlyBreakdown, getCategorySpending } from '../services/reportService';
import { format } from 'date-fns';

const screenWidth = Dimensions.get('window').width - 40;

export default function ReportsScreen() {
  const [monthlyData, setMonthlyData] = useState<any>([]);
  const [categoryData, setCategoryData] = useState<any>([]);
  const currentMonth = format(new Date(), 'yyyy-MM');

  const loadReports = async () => {
    const db = await getDB();

    // Monthly income vs expense
    const breakdown = await getMonthlyBreakdown(db, currentMonth);
    const income = breakdown.find((b: any) => b.type === 'INCOME')?.totalBase || 0;
    const expense = Math.abs(breakdown.find((b: any) => b.type === 'EXPENSE')?.totalBase || 0);

    setMonthlyData({
      labels: ['Income', 'Expense'],
      datasets: [{ data: [income, expense] }],
    });

    // Category spending (pie chart)
    const categories = await getCategorySpending(db, currentMonth);
    const pieData = categories.map((cat: any, index: number) => ({
      name: cat.categoryName,
      population: Math.abs(cat.total),
      color: ['#2563eb', '#ef4444', '#eab308', '#10b981', '#8b5cf6'][index % 5],
      legendFontColor: '#333',
      legendFontSize: 12,
    }));

    setCategoryData(pieData);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 pt-12 px-4">
      <Text className="text-3xl font-bold mb-8">Reports</Text>

      {/* Monthly Overview Bar Chart */}
      <View className="bg-white p-5 rounded-3xl mb-8">
        <Text className="text-xl font-semibold mb-4">This Month Overview</Text>
        <BarChart
          data={monthlyData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          style={{ borderRadius: 16 }}
          showValuesOnTopOfBars
        />
      </View>

      {/* Spending by Category Pie Chart */}
      <View className="bg-white p-5 rounded-3xl mb-8">
        <Text className="text-xl font-semibold mb-4">Spending by Category</Text>
        {categoryData.length > 0 ? (
          <PieChart
            data={categoryData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        ) : (
          <Text className="text-gray-500 py-10 text-center">No expense data yet</Text>
        )}
      </View>

      {/* Future sections: Net Worth Trend, Investment Performance, etc. */}
      <View className="bg-white p-6 rounded-3xl mb-12">
        <Text className="text-xl font-semibold">More Insights Coming Soon</Text>
        <Text className="text-gray-500 mt-2">• Net worth over time\n• Investment returns\n• Cash flow trends</Text>
      </View>
    </ScrollView>
  );
}
```

### 3. Account Creation Form

#### New Component: `AccountFormModal.tsx`

```tsx
// src/components/AccountFormModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getDB } from '../database/database';
import { AccountType } from '../types/finance';

interface AccountFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [account, setAccount] = useState({
    name: '',
    type: 'bank' as AccountType,
    currency: 'HUF',
    balance: '0',
    icon: '🏦',
    color: '#0066CC',
    notes: '',
  });

  const handleCreate = async () => {
    if (!account.name.trim()) {
      Alert.alert('Error', 'Account name is required');
      return;
    }

    try {
      const db = await getDB();
      const id = `acc_${Date.now().toString(36)}`;

      await db.runAsync(`
        INSERT INTO accounts (id, name, type, currency, balance, icon, color, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        account.name,
        account.type,
        account.currency,
        account.balance,
        account.icon,
        account.color,
        account.notes || null,
      ]);

      Alert.alert('Success', 'Account created successfully!');
      onSuccess?.();
      onClose();
      // Reset form
      setAccount({ name: '', type: 'bank', currency: 'HUF', balance: '0', icon: '🏦', color: '#0066CC', notes: '' });
    } catch (error) {
      Alert.alert('Error', 'Failed to create account');
      console.error(error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView className="flex-1 bg-gray-50 p-6 pt-12">
        <Text className="text-3xl font-bold mb-8">New Account</Text>

        <Text className="text-sm text-gray-500 mb-2">Account Name</Text>
        <TextInput
          className="border border-gray-300 rounded-2xl p-4 mb-6 text-lg"
          value={account.name}
          onChangeText={(text) => setAccount({ ...account, name: text })}
          placeholder="e.g. Binance Crypto Wallet"
        />

        <Text className="text-sm text-gray-500 mb-2">Type</Text>
        <View className="border border-gray-300 rounded-2xl overflow-hidden mb-6">
          <Picker
            selectedValue={account.type}
            onValueChange={(value) => setAccount({ ...account, type: value as AccountType })}
          >
            <Picker.Item label="Bank" value="bank" />
            <Picker.Item label="Crypto Wallet" value="crypto" />
            <Picker.Item label="Investment" value="investment" />
            <Picker.Item label="Credit Card" value="credit_card" />
            <Picker.Item label="Loan" value="loan" />
            <Picker.Item label="Cash" value="cash" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>

        <Text className="text-sm text-gray-500 mb-2">Currency</Text>
        <View className="border border-gray-300 rounded-2xl overflow-hidden mb-6">
          <Picker
            selectedValue={account.currency}
            onValueChange={(value) => setAccount({ ...account, currency: value })}
          >
            <Picker.Item label="HUF" value="HUF" />
            <Picker.Item label="USD" value="USD" />
            <Picker.Item label="EUR" value="EUR" />
            <Picker.Item label="BTC" value="BTC" />
          </Picker>
        </View>

        <Text className="text-sm text-gray-500 mb-2">Initial Balance</Text>
        <TextInput
          className="border border-gray-300 rounded-2xl p-4 mb-6 text-lg"
          keyboardType="numeric"
          value={account.balance}
          onChangeText={(text) => setAccount({ ...account, balance: text })}
          placeholder="0.00"
        />

        <Text className="text-sm text-gray-500 mb-2">Notes (optional)</Text>
        <TextInput
          className="border border-gray-300 rounded-2xl p-4 h-24 mb-10"
          multiline
          value={account.notes}
          onChangeText={(text) => setAccount({ ...account, notes: text })}
          placeholder="Main salary account or crypto long-term holdings..."
        />

        <TouchableOpacity
          onPress={handleCreate}
          className="bg-blue-600 py-5 rounded-2xl"
        >
          <Text className="text-white text-center text-xl font-semibold">Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} className="py-5 mt-4">
          <Text className="text-center text-gray-500">Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
};
```

#### Update `AccountsScreen.tsx`

Add the modal state and FAB (similar to the transaction FAB):

```tsx
const [showAccountModal, setShowAccountModal] = useState(false);

// In the return JSX, add:
<AccountFormModal
  visible={showAccountModal}
  onClose={() => setShowAccountModal(false)}
  onSuccess={loadAccounts}
/>

// Replace the old floating button with:
<TouchableOpacity 
  onPress={() => setShowAccountModal(true)}
  className="absolute bottom-8 right-6 bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-2xl"
>
  <Ionicons name="add" size={32} color="white" />
</TouchableOpacity>
```

### Final Integration Tips

1. Import the new modal in `AppNavigator.tsx` if needed.
2. Update `DashboardScreen` and `TransactionListScreen` to include the `TransactionFormModal` and FAB.
3. Add `react-native-chart-kit` and `react-native-svg` to your dependencies.

You now have:
- Quick-add FAB on Dashboard & Transactions
- Beautiful Reports screen with bar + pie charts
- Full Account creation form with modal

