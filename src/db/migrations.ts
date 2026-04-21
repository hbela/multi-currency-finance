import { db } from './db';

const SCHEMA_VERSION = 6;

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

  if (current < 5) {
    // Widen categories.type CHECK to allow all TxnType values.
    // Use legacy_alter_table so the RENAME doesn't rewrite FK references
    // in other tables (e.g. transactions.category_id → categories_v4).
    await db.execAsync(`PRAGMA foreign_keys = OFF;`);
    await db.execAsync(`PRAGMA legacy_alter_table = ON;`);
    await db.execAsync(`DROP TABLE IF EXISTS categories_v4;`);
    await db.execAsync(`ALTER TABLE categories RENAME TO categories_v4;`);
    await db.execAsync(`
      CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        type TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
    await db.runAsync(
      `INSERT INTO categories (id, name, icon, type, created_at)
       SELECT id, name, icon, type, created_at FROM categories_v4;`
    );
    await db.execAsync(`DROP TABLE categories_v4;`);
    await db.execAsync(`PRAGMA legacy_alter_table = OFF;`);
    await db.execAsync(`PRAGMA foreign_keys = ON;`);
  }

  if (current < 6) {
    // Overhaul: unified multi-currency transaction model + account balance fields.
    // Drop recurring_transactions (recurring now lives inside transactions).
    await db.execAsync(`PRAGMA foreign_keys = OFF;`);
    await db.execAsync(`PRAGMA legacy_alter_table = ON;`);

    // Recreate transactions with new schema
    await db.execAsync(`DROP TABLE IF EXISTS transactions_v5;`);
    await db.execAsync(`ALTER TABLE transactions RENAME TO transactions_v5;`);
    await db.execAsync(`
      CREATE TABLE transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        date INTEGER NOT NULL,
        amount TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'HUF',
        amountBase TEXT NOT NULL DEFAULT '0',
        baseCurrency TEXT NOT NULL DEFAULT 'HUF',
        exchangeRate TEXT NOT NULL DEFAULT '1',
        accountId TEXT,
        categoryId TEXT,
        relatedTransactionId TEXT,
        description TEXT,
        source TEXT,
        tags TEXT,
        notes TEXT,
        details TEXT,
        isRecurring INTEGER NOT NULL DEFAULT 0,
        recurringRule TEXT,
        recurringParentId TEXT,
        status TEXT NOT NULL DEFAULT 'cleared',
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY(accountId) REFERENCES accounts(id) ON DELETE SET NULL,
        FOREIGN KEY(categoryId) REFERENCES categories(id) ON DELETE SET NULL
      );
    `);

    // Migrate old rows: map old type values to new TransactionType
    await db.execAsync(`
      INSERT INTO transactions (
        id, type, date, amount, currency, amountBase, baseCurrency, exchangeRate,
        accountId, categoryId, relatedTransactionId, description, source, tags, notes,
        details, isRecurring, recurringRule, recurringParentId, status, createdAt, updatedAt
      )
      SELECT
        id,
        CASE type
          WHEN 'income'       THEN 'INCOME'
          WHEN 'expense'      THEN 'EXPENSE'
          WHEN 'transfer'     THEN 'TRANSFER'
          WHEN 'investment'   THEN 'INVESTMENT_BUY'
          WHEN 'debt'         THEN 'LOAN_RECEIVED'
          WHEN 'subscription' THEN 'EXPENSE'
          ELSE 'EXPENSE'
        END,
        date,
        CAST(amount AS TEXT),
        COALESCE(currency, 'HUF'),
        CAST(amount AS TEXT),
        'HUF',
        COALESCE(CAST(exchange_rate AS TEXT), '1'),
        account_id,
        category_id,
        NULL,
        note,
        source,
        NULL,
        NULL,
        json_object(
          'merchant', merchant, 'payer', payer, 'counterparty', counterparty,
          'reference', reference, 'fee', fee, 'security_name', security_name,
          'symbol', symbol, 'quantity', quantity, 'price', price,
          'order_type', order_type, 'creditor', creditor, 'debt_type', debt_type,
          'interest_rate', interest_rate, 'remaining_term', remaining_term,
          'provider', provider, 'plan', plan
        ),
        0,
        NULL,
        NULL,
        'cleared',
        created_at,
        created_at
      FROM transactions_v5;
    `);

    await db.execAsync(`DROP TABLE transactions_v5;`);

    // Upgrade accounts: add balance and metadata columns
    await db.execAsync(`
      ALTER TABLE accounts ADD COLUMN balance TEXT NOT NULL DEFAULT '0';
      ALTER TABLE accounts ADD COLUMN isActive INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE accounts ADD COLUMN icon TEXT;
      ALTER TABLE accounts ADD COLUMN color TEXT;
      ALTER TABLE accounts ADD COLUMN notes TEXT;
    `);

    // Upgrade categories: add isDefault and parentId
    await db.execAsync(`
      ALTER TABLE categories ADD COLUMN isDefault INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE categories ADD COLUMN parentId TEXT;
    `);

    // Drop old recurring_transactions table (recurring is now in transactions)
    await db.execAsync(`DROP TABLE IF EXISTS recurring_transactions;`);

    // Recreate indexes
    await db.execAsync(`
      DROP INDEX IF EXISTS idx_transactions_date;
      DROP INDEX IF EXISTS idx_transactions_category;
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_accountId ON transactions(accountId);
      CREATE INDEX IF NOT EXISTS idx_transactions_categoryId ON transactions(categoryId);
    `);

    await db.execAsync(`PRAGMA legacy_alter_table = OFF;`);
    await db.execAsync(`PRAGMA foreign_keys = ON;`);
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
};
