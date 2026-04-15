import { db } from './db';
import { newId } from '../utils/id';

const DEFAULT_EXPENSE_CATEGORIES: { name: string; icon: string }[] = [
  { name: 'Food', icon: 'food' },
  { name: 'Transport', icon: 'car' },
  { name: 'Bills', icon: 'file-document' },
  { name: 'Entertainment', icon: 'gamepad-variant' },
  { name: 'Shopping', icon: 'cart' },
  { name: 'Health', icon: 'heart-pulse' },
  { name: 'Other', icon: 'dots-horizontal' },
];

const DEFAULT_INCOME_CATEGORIES: { name: string; icon: string }[] = [
  { name: 'Salary', icon: 'cash' },
  { name: 'Gift', icon: 'gift' },
  { name: 'Other Income', icon: 'plus-circle' },
];

export const seedIfEmpty = async (): Promise<void> => {
  const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM categories');
  if ((row?.c ?? 0) > 0) return;

  const now = Date.now();

  for (const c of DEFAULT_EXPENSE_CATEGORIES) {
    await db.runAsync(
      'INSERT INTO categories (id, name, icon, type, created_at) VALUES (?, ?, ?, ?, ?)',
      [newId(), c.name, c.icon, 'expense', now]
    );
  }
  for (const c of DEFAULT_INCOME_CATEGORIES) {
    await db.runAsync(
      'INSERT INTO categories (id, name, icon, type, created_at) VALUES (?, ?, ?, ?, ?)',
      [newId(), c.name, c.icon, 'income', now]
    );
  }

  const accountRow = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM accounts');
  if ((accountRow?.c ?? 0) === 0) {
    await db.runAsync(
      'INSERT INTO accounts (id, name, type, currency, created_at) VALUES (?, ?, ?, ?, ?)',
      [newId(), 'Cash', 'cash', 'USD', now]
    );
  }
};
