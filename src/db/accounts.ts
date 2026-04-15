import { db } from './db';
import { Account, AccountType } from '../types';
import { newId } from '../utils/id';

export const listAccounts = (): Promise<Account[]> =>
  db.getAllAsync<Account>('SELECT * FROM accounts ORDER BY created_at ASC');

export const createAccount = async (input: {
  name: string;
  type: AccountType;
  currency: string;
}): Promise<Account> => {
  const row: Account = {
    id: newId(),
    name: input.name,
    type: input.type,
    currency: input.currency,
    created_at: Date.now(),
  };
  await db.runAsync(
    'INSERT INTO accounts (id, name, type, currency, created_at) VALUES (?, ?, ?, ?, ?)',
    [row.id, row.name, row.type, row.currency, row.created_at]
  );
  return row;
};

export const updateAccount = async (row: Account): Promise<void> => {
  await db.runAsync(
    'UPDATE accounts SET name = ?, type = ?, currency = ? WHERE id = ?',
    [row.name, row.type, row.currency, row.id]
  );
};

export const deleteAccount = async (id: string): Promise<void> => {
  await db.runAsync('DELETE FROM accounts WHERE id = ?', [id]);
};

export const getAccountBalance = async (accountId: string): Promise<number> => {
  const row = await db.getFirstAsync<{ balance: number | null }>(
    `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS balance
     FROM transactions WHERE account_id = ?`,
    [accountId]
  );
  return row?.balance ?? 0;
};

export const getTotalBalance = async (): Promise<number> => {
  const row = await db.getFirstAsync<{ balance: number | null }>(
    `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS balance
     FROM transactions`
  );
  return row?.balance ?? 0;
};
