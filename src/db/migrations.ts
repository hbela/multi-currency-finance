import { db } from './db';

const SCHEMA_VERSION = 3;

export const runMigrations = async (): Promise<void> => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  if (current < 1) {
    await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      currency TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      date INTEGER NOT NULL,
      note TEXT,
      account_id TEXT,
      category_id TEXT,
      receipt_image TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE SET NULL,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      amount REAL NOT NULL,
      month TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_cat_month ON budgets(category_id, month);

    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      category_id TEXT,
      frequency TEXT NOT NULL,
      next_due_date INTEGER NOT NULL
    );
    `);
  }

  if (current < 2) {
    await db.execAsync(`
      ALTER TABLE recurring_transactions ADD COLUMN type TEXT NOT NULL DEFAULT 'expense';
      ALTER TABLE recurring_transactions ADD COLUMN account_id TEXT;
      ALTER TABLE recurring_transactions ADD COLUMN note TEXT;
      ALTER TABLE recurring_transactions ADD COLUMN start_date INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE recurring_transactions ADD COLUMN end_date INTEGER;
      ALTER TABLE recurring_transactions ADD COLUMN last_run_date INTEGER;
      ALTER TABLE recurring_transactions ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE recurring_transactions ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0;
      CREATE INDEX IF NOT EXISTS idx_recurring_next_due ON recurring_transactions(next_due_date);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
};
