import { db } from './db';
import { Account, AccountType } from '../types';
import { newId } from '../utils/id';

export const listAccounts = (): Promise<Account[]> =>
  db.getAllAsync<Account>(
    'SELECT * FROM accounts WHERE isActive = 1 ORDER BY created_at ASC'
  );

export const listAllAccounts = (): Promise<Account[]> =>
  db.getAllAsync<Account>('SELECT * FROM accounts ORDER BY created_at ASC');

export const createAccount = async (input: {
  name: string;
  type: AccountType;
  currency: string;
  institution?: string | null;
  icon?: string | null;
  color?: string | null;
  notes?: string | null;
}): Promise<Account> => {
  const row: Account = {
    id: newId(),
    name: input.name,
    type: input.type,
    currency: input.currency,
    balance: '0',
    isActive: 1,
    institution: input.institution ?? null,
    icon: input.icon ?? null,
    color: input.color ?? null,
    notes: input.notes ?? null,
    created_at: Date.now(),
  };
  await db.runAsync(
    `INSERT INTO accounts (id, name, type, currency, balance, isActive, institution, icon, color, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.name, row.type, row.currency, row.balance, row.isActive, row.institution, row.icon, row.color, row.notes, row.created_at]
  );
  return row;
};

export const updateAccount = async (row: Account): Promise<void> => {
  await db.runAsync(
    `UPDATE accounts SET name = ?, type = ?, currency = ?, institution = ?, icon = ?, color = ?, notes = ? WHERE id = ?`,
    [row.name, row.type, row.currency, row.institution, row.icon, row.color, row.notes, row.id]
  );
};

export const deactivateAccount = async (id: string): Promise<void> => {
  await db.runAsync('UPDATE accounts SET isActive = 0 WHERE id = ?', [id]);
};

export const deleteAccount = async (id: string): Promise<void> => {
  await db.runAsync('DELETE FROM accounts WHERE id = ?', [id]);
};

/** Apply a numeric delta to an account's balance (called inside atomic transaction). */
export const updateAccountBalance = (accountId: string, delta: number): void => {
  db.runSync(
    `UPDATE accounts SET balance = CAST(CAST(balance AS REAL) + ? AS TEXT) WHERE id = ?`,
    [delta, accountId]
  );
};

/** Sum of all active account balances (in their stored currency — for net worth use amountBase). */
export const getNetWorth = async (): Promise<number> => {
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT COALESCE(SUM(CAST(balance AS REAL)), 0) AS total FROM accounts WHERE isActive = 1`
  );
  return row?.total ?? 0;
};
