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

export type CreateTransactionInput = {
  amount: number;
  type: TxnType;
  date: number;
  note: string | null;
  account_id: string | null;
  category_id: string | null;
  receipt_image: string | null;
  currency?: string | null;
  exchange_rate?: number | null;
  original_amount?: number | null;
  original_currency?: string | null;
  merchant?: string | null;
  is_reimbursable?: 0 | 1 | null;
  source?: string | null;
  payer?: string | null;
  is_taxable?: 0 | 1 | null;
  counterparty?: string | null;
  reference?: string | null;
  fee?: number | null;
  security_name?: string | null;
  symbol?: string | null;
  quantity?: number | null;
  price?: number | null;
  order_type?: string | null;
  creditor?: string | null;
  debt_type?: string | null;
  interest_rate?: number | null;
  remaining_term?: number | null;
  provider?: string | null;
  plan?: string | null;
  next_billing_date?: number | null;
  is_auto_renew?: 0 | 1 | null;
};

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  const row: Transaction = {
    id: newId(),
    amount: input.amount,
    type: input.type,
    date: input.date,
    note: input.note,
    account_id: input.account_id,
    category_id: input.category_id,
    receipt_image: input.receipt_image,
    created_at: Date.now(),
    currency: input.currency ?? null,
    exchange_rate: input.exchange_rate ?? null,
    original_amount: input.original_amount ?? null,
    original_currency: input.original_currency ?? null,
    merchant: input.merchant ?? null,
    is_reimbursable: input.is_reimbursable ?? null,
    source: input.source ?? null,
    payer: input.payer ?? null,
    is_taxable: input.is_taxable ?? null,
    counterparty: input.counterparty ?? null,
    reference: input.reference ?? null,
    fee: input.fee ?? null,
    security_name: input.security_name ?? null,
    symbol: input.symbol ?? null,
    quantity: input.quantity ?? null,
    price: input.price ?? null,
    order_type: input.order_type ?? null,
    creditor: input.creditor ?? null,
    debt_type: input.debt_type ?? null,
    interest_rate: input.interest_rate ?? null,
    remaining_term: input.remaining_term ?? null,
    provider: input.provider ?? null,
    plan: input.plan ?? null,
    next_billing_date: input.next_billing_date ?? null,
    is_auto_renew: input.is_auto_renew ?? null,
  };
  await db.runAsync(
    `INSERT INTO transactions (
       id, amount, type, date, note, account_id, category_id, receipt_image, created_at,
       currency, exchange_rate, original_amount, original_currency,
       merchant, is_reimbursable,
       source, payer, is_taxable,
       counterparty, reference, fee,
       security_name, symbol, quantity, price, order_type,
       creditor, debt_type, interest_rate, remaining_term,
       provider, plan, next_billing_date, is_auto_renew
     ) VALUES (
       ?, ?, ?, ?, ?, ?, ?, ?, ?,
       ?, ?, ?, ?,
       ?, ?,
       ?, ?, ?,
       ?, ?, ?,
       ?, ?, ?, ?, ?,
       ?, ?, ?, ?,
       ?, ?, ?, ?
     )`,
    [
      row.id, row.amount, row.type, row.date, row.note, row.account_id, row.category_id, row.receipt_image, row.created_at,
      row.currency, row.exchange_rate, row.original_amount, row.original_currency,
      row.merchant, row.is_reimbursable,
      row.source, row.payer, row.is_taxable,
      row.counterparty, row.reference, row.fee,
      row.security_name, row.symbol, row.quantity, row.price, row.order_type,
      row.creditor, row.debt_type, row.interest_rate, row.remaining_term,
      row.provider, row.plan, row.next_billing_date, row.is_auto_renew,
    ]
  );
  return row;
};

export const updateTransaction = async (row: Transaction): Promise<void> => {
  await db.runAsync(
    `UPDATE transactions SET
       amount = ?, type = ?, date = ?, note = ?,
       account_id = ?, category_id = ?, receipt_image = ?,
       currency = ?, exchange_rate = ?, original_amount = ?, original_currency = ?,
       merchant = ?, is_reimbursable = ?,
       source = ?, payer = ?, is_taxable = ?,
       counterparty = ?, reference = ?, fee = ?,
       security_name = ?, symbol = ?, quantity = ?, price = ?, order_type = ?,
       creditor = ?, debt_type = ?, interest_rate = ?, remaining_term = ?,
       provider = ?, plan = ?, next_billing_date = ?, is_auto_renew = ?
     WHERE id = ?`,
    [
      row.amount, row.type, row.date, row.note,
      row.account_id, row.category_id, row.receipt_image,
      row.currency, row.exchange_rate, row.original_amount, row.original_currency,
      row.merchant, row.is_reimbursable,
      row.source, row.payer, row.is_taxable,
      row.counterparty, row.reference, row.fee,
      row.security_name, row.symbol, row.quantity, row.price, row.order_type,
      row.creditor, row.debt_type, row.interest_rate, row.remaining_term,
      row.provider, row.plan, row.next_billing_date, row.is_auto_renew,
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
