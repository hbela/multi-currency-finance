import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('finance.db');

/** Wipe all user data so the next app start re-runs the seed. */
export const resetDatabase = async (): Promise<void> => {
  await db.execAsync(`PRAGMA foreign_keys = OFF;`);
  await db.execAsync(`
    DELETE FROM transactions;
    DELETE FROM accounts;
    DELETE FROM categories;
    DELETE FROM budgets;
  `);
  await db.execAsync(`PRAGMA foreign_keys = ON;`);
};
