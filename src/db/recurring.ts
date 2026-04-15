import { db } from './db';
import { RecurringTransaction, RecurringFrequency, TxnType } from '../types';
import { newId } from '../utils/id';
import { advanceByFrequency } from '../utils/date';
import { createTransaction } from './transactions';

export const listRecurring = (): Promise<RecurringTransaction[]> =>
  db.getAllAsync<RecurringTransaction>(
    'SELECT * FROM recurring_transactions ORDER BY active DESC, next_due_date ASC'
  );

export interface RecurringInput {
  amount: number;
  type: TxnType;
  category_id: string | null;
  account_id: string | null;
  note: string | null;
  frequency: RecurringFrequency;
  start_date: number;
  end_date: number | null;
}

export const createRecurring = async (input: RecurringInput): Promise<RecurringTransaction> => {
  const row: RecurringTransaction = {
    id: newId(),
    amount: input.amount,
    type: input.type,
    category_id: input.category_id,
    account_id: input.account_id,
    note: input.note,
    frequency: input.frequency,
    start_date: input.start_date,
    next_due_date: input.start_date,
    end_date: input.end_date,
    last_run_date: null,
    active: 1,
    created_at: Date.now(),
  };
  await db.runAsync(
    `INSERT INTO recurring_transactions
       (id, amount, type, category_id, account_id, note, frequency,
        start_date, next_due_date, end_date, last_run_date, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.amount,
      row.type,
      row.category_id,
      row.account_id,
      row.note,
      row.frequency,
      row.start_date,
      row.next_due_date,
      row.end_date,
      row.last_run_date,
      row.active,
      row.created_at,
    ]
  );
  return row;
};

export const updateRecurring = async (row: RecurringTransaction): Promise<void> => {
  await db.runAsync(
    `UPDATE recurring_transactions SET
       amount = ?, type = ?, category_id = ?, account_id = ?, note = ?,
       frequency = ?, start_date = ?, next_due_date = ?, end_date = ?,
       last_run_date = ?, active = ?
     WHERE id = ?`,
    [
      row.amount,
      row.type,
      row.category_id,
      row.account_id,
      row.note,
      row.frequency,
      row.start_date,
      row.next_due_date,
      row.end_date,
      row.last_run_date,
      row.active,
      row.id,
    ]
  );
};

export const deleteRecurring = async (id: string): Promise<void> => {
  await db.runAsync('DELETE FROM recurring_transactions WHERE id = ?', [id]);
};

export const setRecurringActive = async (id: string, active: boolean): Promise<void> => {
  await db.runAsync('UPDATE recurring_transactions SET active = ? WHERE id = ?', [
    active ? 1 : 0,
    id,
  ]);
};

// Materialize all overdue recurring rules into concrete transactions.
// Returns count of transactions created so callers can refresh state.
export const processDueRecurring = async (now: number = Date.now()): Promise<number> => {
  const dueRules = await db.getAllAsync<RecurringTransaction>(
    'SELECT * FROM recurring_transactions WHERE active = 1 AND next_due_date <= ?',
    [now]
  );
  let created = 0;
  for (const rule of dueRules) {
    let next = rule.next_due_date;
    let last = rule.last_run_date;
    let active: 0 | 1 = 1;
    // Safety cap to avoid runaway loops if a rule has an ancient start date.
    for (let i = 0; i < 500; i++) {
      if (next > now) break;
      if (rule.end_date !== null && next > rule.end_date) {
        active = 0;
        break;
      }
      await createTransaction({
        amount: rule.amount,
        type: rule.type,
        date: next,
        note: rule.note,
        account_id: rule.account_id,
        category_id: rule.category_id,
        receipt_image: null,
      });
      created++;
      last = next;
      next = advanceByFrequency(next, rule.frequency);
    }
    if (rule.end_date !== null && next > rule.end_date) active = 0;
    await db.runAsync(
      'UPDATE recurring_transactions SET next_due_date = ?, last_run_date = ?, active = ? WHERE id = ?',
      [next, last, active, rule.id]
    );
  }
  return created;
};
