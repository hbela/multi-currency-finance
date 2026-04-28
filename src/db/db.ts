import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('finance.db');

/** Wipe all user data so the next app start re-runs the seed. */
export const resetDatabase = async (): Promise<void> => {
  await db.execAsync(`PRAGMA foreign_keys = OFF;`);
  await db.execAsync(`
    DELETE FROM ledger_entries;
    DELETE FROM loan_payments;
    DELETE FROM loans;
    DELETE FROM holdings;
    DELETE FROM assets;
    DELETE FROM exchange_rates;
    DELETE FROM transactions;
    DELETE FROM accounts;
    DELETE FROM categories;
    DELETE FROM budgets;
  `);
  await db.execAsync(`PRAGMA foreign_keys = ON;`);
  // Note: currencies table is NOT cleared — it is static reference data seeded by migration v7.
};
