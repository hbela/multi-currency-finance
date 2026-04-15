import { db } from './db';
import { Budget, BudgetProgress } from '../types';
import { newId } from '../utils/id';
import { monthRange } from '../utils/date';

export const listBudgets = (): Promise<Budget[]> =>
  db.getAllAsync<Budget>('SELECT * FROM budgets ORDER BY month DESC');

export const listBudgetsByMonth = (month: string): Promise<Budget[]> =>
  db.getAllAsync<Budget>('SELECT * FROM budgets WHERE month = ? ORDER BY created_at ASC', [month]);

export const createBudget = async (input: {
  category_id: string;
  amount: number;
  month: string;
}): Promise<Budget> => {
  const row: Budget = {
    id: newId(),
    category_id: input.category_id,
    amount: input.amount,
    month: input.month,
    created_at: Date.now(),
  };
  await db.runAsync(
    `INSERT INTO budgets (id, category_id, amount, month, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(category_id, month) DO UPDATE SET amount = excluded.amount`,
    [row.id, row.category_id, row.amount, row.month, row.created_at]
  );
  return row;
};

export const updateBudget = async (row: Budget): Promise<void> => {
  await db.runAsync('UPDATE budgets SET amount = ?, month = ? WHERE id = ?', [
    row.amount,
    row.month,
    row.id,
  ]);
};

export const deleteBudget = async (id: string): Promise<void> => {
  await db.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
};

export const getBudgetProgressForMonth = async (month: string): Promise<BudgetProgress[]> => {
  const { start, end } = monthRange(month);
  const rows = await db.getAllAsync<
    Budget & { spent: number | null }
  >(
    `SELECT b.*, COALESCE((
       SELECT SUM(t.amount) FROM transactions t
       WHERE t.category_id = b.category_id
         AND t.type = 'expense'
         AND t.date >= ? AND t.date < ?
     ), 0) AS spent
     FROM budgets b
     WHERE b.month = ?
     ORDER BY b.created_at ASC`,
    [start, end, month]
  );
  return rows.map((r) => {
    const spent = r.spent ?? 0;
    const remaining = r.amount - spent;
    const percent = r.amount > 0 ? spent / r.amount : 0;
    const { spent: _drop, ...budget } = r;
    return { budget, spent, remaining, percent };
  });
};
