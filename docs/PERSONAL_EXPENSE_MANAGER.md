Goal:Build a personal finance app with React Native + Expo + SQLite. Structure this as a **production-grade starting blueprint** for the app using:

* React Native + Expo
* SQLite (via Expo SQLite)
* React Native Paper (UI)
* Zustand (state)

---

# 1️⃣ Database Schema (SQLite)

Design for flexibility and reporting.

## 📦 Tables

### `accounts`

```sql
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- cash, bank, card
  currency TEXT NOT NULL,
  created_at INTEGER
);
```

### `categories`

```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  type TEXT CHECK(type IN ('income', 'expense')),
  created_at INTEGER
);
```

### `transactions`

```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  type TEXT CHECK(type IN ('income', 'expense')),
  date INTEGER NOT NULL,
  note TEXT,
  account_id TEXT,
  category_id TEXT,
  receipt_image TEXT,
  created_at INTEGER,
  FOREIGN KEY(account_id) REFERENCES accounts(id),
  FOREIGN KEY(category_id) REFERENCES categories(id)
);
```

### `budgets`

```sql
CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  category_id TEXT,
  amount REAL NOT NULL,
  month TEXT,
  created_at INTEGER
);
```

### `recurring_transactions`

```sql
CREATE TABLE recurring_transactions (
  id TEXT PRIMARY KEY,
  amount REAL,
  category_id TEXT,
  frequency TEXT, -- weekly, monthly, yearly
  next_due_date INTEGER
);
```

---

# 2️⃣ UI / Screen Flow

## 🧭 Navigation Structure

```
Tabs
 ├── Dashboard
 ├── Transactions
 ├── Budgets
 ├── Reports
 └── Settings
```

---

## 🏠 Dashboard

* Total balance
* Monthly income vs expenses
* Recent transactions
* Quick add button

---

## 💳 Transactions

* List (grouped by date)
* Filter by category/date
* Add/Edit transaction
* Receipt scan option

---

## 📊 Budgets

* Budget per category
* Progress bars
* Warnings when overspending

---

## 📈 Reports

* Category spending breakdown
* Monthly trends
* Year comparison

---

## ⚙️ Settings

* Manage categories
* Manage accounts
* Currency
* Export/Import DB
* Privacy / Backup

---

# 3️⃣ Feature Roadmap

## Phase 1 — MVP

✔ Add/Edit/Delete transactions
✔ Categories + Accounts
✔ Budgets
✔ Dashboard summary
✔ Offline SQLite storage

---

## Phase 2 — Smart Features

✔ Receipt OCR
✔ Auto expense creation
✔ Recurring transactions
✔ Charts

---

## Phase 3 — Premium Features

✔ Smart suggestions
✔ Insights & alerts
✔ Backup / sync
✔ Multi-device

---

# 4️⃣ Project Folder Structure

```
src/
 ├── app/
 │   ├── (tabs)/
 │   │    ├── index.tsx        # Dashboard
 │   │    ├── transactions.tsx
 │   │    ├── budgets.tsx
 │   │    ├── reports.tsx
 │   │    └── settings.tsx
 │
 ├── components/
 │   ├── TransactionItem.tsx
 │   ├── CategoryPicker.tsx
 │   ├── AmountInput.tsx
 │   └── ReceiptScanner.tsx
 │
 ├── db/
 │   ├── db.ts
 │   ├── migrations.ts
 │   ├── transactions.ts
 │   ├── accounts.ts
 │   └── categories.ts
 │
 ├── store/
 │   ├── transactionStore.ts
 │   ├── categoryStore.ts
 │   └── budgetStore.ts
 │
 ├── utils/
 │   ├── format.ts
 │   └── date.ts
 │
 └── types/
     └── index.ts
```

---

# 5️⃣ Starter Code

## 🧱 SQLite Setup

```ts
// src/db/db.ts
import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabase("finance.db");
```

---

## 🗃️ Initialize Tables

```ts
// src/db/migrations.ts
import { db } from "./db";

export const initDB = () => {
  db.transaction(tx => {
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount REAL,
        type TEXT,
        date INTEGER,
        note TEXT,
        category_id TEXT
      );
    `);
  });
};
```

---

## 🧠 Zustand Store Example

```ts
// src/store/transactionStore.ts
import { create } from "zustand";

export const useTransactionStore = create(set => ({
  transactions: [],
  setTransactions: data => set({ transactions: data }),
  addTransaction: tx =>
    set(state => ({
      transactions: [tx, ...state.transactions],
    })),
}));
```

---

## 📝 Add Transaction Example

```ts
import { db } from "../db/db";

export const addTransaction = tx => {
  db.transaction(t => {
    t.executeSql(
      `INSERT INTO transactions (id, amount, type, date)
       VALUES (?, ?, ?, ?)`,
      [tx.id, tx.amount, tx.type, tx.date]
    );
  });
};
```

---

## 📸 Receipt OCR Placeholder

```ts
// src/components/ReceiptScanner.tsx
export default function ReceiptScanner() {
  return (
    <>
      {/* camera + OCR here later */}
    </>
  );
}
```

---


