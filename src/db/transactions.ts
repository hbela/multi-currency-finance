import { db } from './db';
import { Transaction, TxnType, MonthlyTotals } from '../types';
import { newId } from '../utils/id';
import { monthRange } from '../utils/date';

export const listTransactions = (): Promise<Transaction[]> =>
  db.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY date DESC, created_at DESC');

export const getTransaction = (id: string): Promise<Transaction | null> =>
  db
    .getFirstAsync<Transaction>('SELECT * FROM transactions WHERE id = ?', [id])
    .then((r) => r ?? null);

export const listRecentTransactions = (limit = 5): Promise<Transaction[]> =>
  db.getAllAsync<Transaction>(
    'SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT ?',
    [limit]
  );

export const listTransactionsByMonth = (month: string): Promise<Transaction[]> => {
  const { start, end } = monthRange(month);
  return db.getAllAsync<Transaction>(
    'SELECT * FROM transactions WHERE date >= ? AND date < ? ORDER BY date DESC, created_at DESC',
    [start, end]
  );
};

export const createTransaction = async (input: {
  amount: number;
  type: TxnType;
  date: number;
  note: string | null;
  account_id: string | null;
  category_id: string | null;
}): Promise<Transaction> => {
  const row: Transaction = {
    id: newId(),
    amount: input.amount,
    type: input.type,
    date: input.date,
    note: input.note,
    account_id: input.account_id,
    category_id: input.category_id,
    receipt_image: null,
    created_at: Date.now(),
  };
  await db.runAsync(
    `INSERT INTO transactions
       (id, amount, type, date, note, account_id, category_id, receipt_image, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.amount,
      row.type,
      row.date,
      row.note,
      row.account_id,
      row.category_id,
      row.receipt_image,
      row.created_at,
    ]
  );
  return row;
};

export const updateTransaction = async (row: Transaction): Promise<void> => {
  await db.runAsync(
    `UPDATE transactions SET
       amount = ?, type = ?, date = ?, note = ?,
       account_id = ?, category_id = ?, receipt_image = ?
     WHERE id = ?`,
    [
      row.amount,
      row.type,
      row.date,
      row.note,
      row.account_id,
      row.category_id,
      row.receipt_image,
      row.id,
    ]
  );
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
};

export const getMonthlyTotals = async (month: string): Promise<MonthlyTotals> => {
  const { start, end } = monthRange(month);
  const row = await db.getFirstAsync<{ income: number | null; expense: number | null }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
     FROM transactions WHERE date >= ? AND date < ?`,
    [start, end]
  );
  return { income: row?.income ?? 0, expense: row?.expense ?? 0 };
};

export interface CategoryBreakdownRow {
  category_id: string | null;
  total: number;
}

export const getCategoryBreakdown = async (
  month: string,
  type: TxnType
): Promise<CategoryBreakdownRow[]> => {
  const { start, end } = monthRange(month);
  return db.getAllAsync<CategoryBreakdownRow>(
    `SELECT category_id, SUM(amount) AS total
     FROM transactions
     WHERE date >= ? AND date < ? AND type = ?
     GROUP BY category_id
     ORDER BY total DESC`,
    [start, end, type]
  );
};

export interface MonthlySeriesPoint {
  month: string;
  income: number;
  expense: number;
}

export const getMonthlyTotalsSeries = async (
  months: string[]
): Promise<MonthlySeriesPoint[]> => {
  if (months.length === 0) return [];
  const { start } = monthRange(months[0]);
  const { end } = monthRange(months[months.length - 1]);
  const rows = await db.getAllAsync<{
    month: string;
    income: number | null;
    expense: number | null;
  }>(
    `SELECT strftime('%Y-%m', date / 1000, 'unixepoch', 'localtime') AS month,
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
     FROM transactions
     WHERE date >= ? AND date < ?
     GROUP BY month`,
    [start, end]
  );
  const map = new Map(rows.map((r) => [r.month, r]));
  return months.map((m) => {
    const row = map.get(m);
    return {
      month: m,
      income: row?.income ?? 0,
      expense: row?.expense ?? 0,
    };
  });
};
