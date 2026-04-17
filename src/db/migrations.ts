import { db } from './db';

const SCHEMA_VERSION = 4;

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

  if (current < 4) {
    // Recreate transactions table: drop CHECK constraint on type, add 24 type-specific columns.
    await db.execAsync(`ALTER TABLE transactions RENAME TO transactions_v3;`);

    await db.execAsync(`
      CREATE TABLE transactions (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        date INTEGER NOT NULL,
        note TEXT,
        account_id TEXT,
        category_id TEXT,
        receipt_image TEXT,
        created_at INTEGER NOT NULL,
        currency TEXT,
        exchange_rate REAL,
        original_amount REAL,
        original_currency TEXT,
        merchant TEXT,
        is_reimbursable INTEGER,
        source TEXT,
        payer TEXT,
        is_taxable INTEGER,
        counterparty TEXT,
        reference TEXT,
        fee REAL,
        security_name TEXT,
        symbol TEXT,
        quantity REAL,
        price REAL,
        order_type TEXT,
        creditor TEXT,
        debt_type TEXT,
        interest_rate REAL,
        remaining_term INTEGER,
        provider TEXT,
        plan TEXT,
        next_billing_date INTEGER,
        is_auto_renew INTEGER,
        FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE SET NULL,
        FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
      );
    `);

    await db.execAsync(`
      INSERT INTO transactions (
        id, amount, type, date, note, account_id, category_id, receipt_image, created_at,
        currency, exchange_rate, original_amount, original_currency,
        merchant, is_reimbursable, source, payer, is_taxable,
        counterparty, reference, fee,
        security_name, symbol, quantity, price, order_type,
        creditor, debt_type, interest_rate, remaining_term,
        provider, plan, next_billing_date, is_auto_renew
      )
      SELECT
        id, amount, type, date, note, account_id, category_id, receipt_image, created_at,
        NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL, NULL,
        NULL, NULL, NULL,
        NULL, NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL
      FROM transactions_v3;
    `);

    await db.execAsync(`DROP TABLE transactions_v3;`);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
};
