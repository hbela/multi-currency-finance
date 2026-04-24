import { db } from './db';
import {
  Transaction,
  TransactionType,
  TransactionFilters,
  MonthlySummary,
  RecurringRule,
} from '../types';
import { newId } from '../utils/id';
import { monthRange } from '../utils/date';

export type CreateTransactionInput = {
  type: TransactionType;
  date: number;
  amount: string;
  currency: string;
  amountBase: string;
  baseCurrency: string;
  exchangeRate: string;
  accountId: string | null;
  categoryId?: string | null;
  relatedTransactionId?: string | null;
  description?: string | null;
  source?: string | null;
  tags?: string[] | null;
  notes?: string | null;
  details?: Record<string, unknown> | null;
  isRecurring?: boolean;
  recurringRule?: RecurringRule | null;
  recurringParentId?: string | null;
  status?: Transaction['status'];
};

/** Returns +/- numeric delta for an account balance given a transaction type. */
export const getBalanceDelta = (type: TransactionType, amountBase: string): number => {
  const n = parseFloat(amountBase);
  switch (type) {
    case 'INCOME':
    case 'LOAN_RECEIVED':
    case 'INVESTMENT_SELL':
    // case 'DIVIDEND':   // disabled
    // case 'INTEREST':   // disabled
      return n;
    case 'EXPENSE':
    case 'LOAN_REPAYMENT':
    case 'INVESTMENT_BUY':
    // case 'CREDIT_CARD_PAYMENT':  // disabled
      return -n;
    case 'TRANSFER':
      return -n;
    default:
      return 0;
  }
};

/** Atomically inserts a transaction and updates the account balance. */
export const createTransactionWithBalanceUpdate = async (
  input: CreateTransactionInput
): Promise<Transaction> => {
  const now = Date.now();
  const row: Transaction = {
    id: newId(),
    type: input.type,
    date: input.date,
    amount: input.amount,
    currency: input.currency,
    amountBase: input.amountBase,
    baseCurrency: input.baseCurrency,
    exchangeRate: input.exchangeRate,
    accountId: input.accountId,
    categoryId: input.categoryId ?? null,
    relatedTransactionId: input.relatedTransactionId ?? null,
    description: input.description ?? null,
    source: input.source ?? null,
    tags: input.tags ? JSON.stringify(input.tags) : null,
    notes: input.notes ?? null,
    details: input.details ? JSON.stringify(input.details) : null,
    isRecurring: input.isRecurring ? 1 : 0,
    recurringRule: input.recurringRule ? JSON.stringify(input.recurringRule) : null,
    recurringParentId: input.recurringParentId ?? null,
    status: input.status ?? 'cleared',
    createdAt: now,
    updatedAt: now,
  };

  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO transactions (
         id, type, date, amount, currency, amountBase, baseCurrency, exchangeRate,
         accountId, categoryId, relatedTransactionId, description, source, tags,
         notes, details, isRecurring, recurringRule, recurringParentId, status,
         createdAt, updatedAt
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id, row.type, row.date, row.amount, row.currency, row.amountBase,
        row.baseCurrency, row.exchangeRate, row.accountId, row.categoryId,
        row.relatedTransactionId, row.description, row.source, row.tags,
        row.notes, row.details, row.isRecurring, row.recurringRule,
        row.recurringParentId, row.status, row.createdAt, row.updatedAt,
      ]
    );

    if (input.accountId) {
      const delta = getBalanceDelta(input.type, input.amountBase);
      db.runSync(
        `UPDATE accounts SET balance = CAST(CAST(balance AS REAL) + ? AS TEXT) WHERE id = ?`,
        [delta, input.accountId]
      );
    }
  });

  return row;
};

export const listTransactions = (): Promise<Transaction[]> =>
  db.getAllAsync<Transaction>(
    'SELECT * FROM transactions ORDER BY date DESC, createdAt DESC'
  );

export const getTransaction = (id: string): Promise<Transaction | null> =>
  db
    .getFirstAsync<Transaction>('SELECT * FROM transactions WHERE id = ?', [id])
    .then((r) => r ?? null);

export const listRecentTransactions = (limit = 10): Promise<Transaction[]> =>
  db.getAllAsync<Transaction>(
    'SELECT * FROM transactions ORDER BY date DESC, createdAt DESC LIMIT ?',
    [limit]
  );

export const listTransactionsByMonth = (month: string): Promise<Transaction[]> => {
  const { start, end } = monthRange(month);
  return db.getAllAsync<Transaction>(
    'SELECT * FROM transactions WHERE date >= ? AND date < ? ORDER BY date DESC, createdAt DESC',
    [start, end]
  );
};

export const getFilteredTransactions = (filters: TransactionFilters): Promise<Transaction[]> => {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.type) {
    conditions.push('type = ?');
    params.push(filters.type);
  }
  if (filters.accountId) {
    conditions.push('accountId = ?');
    params.push(filters.accountId);
  }
  if (filters.categoryId) {
    conditions.push('categoryId = ?');
    params.push(filters.categoryId);
  }
  if (filters.dateFrom !== undefined) {
    conditions.push('date >= ?');
    params.push(filters.dateFrom);
  }
  if (filters.dateTo !== undefined) {
    conditions.push('date <= ?');
    params.push(filters.dateTo);
  }
  if (filters.search) {
    conditions.push('(description LIKE ? OR source LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return db.getAllAsync<Transaction>(
    `SELECT * FROM transactions ${where} ORDER BY date DESC, createdAt DESC`,
    params
  );
};

export const getMonthlySummary = async (year: number, month: number): Promise<MonthlySummary> => {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const { start, end } = monthRange(monthStr);
  const row = await db.getFirstAsync<{ income: number | null; expense: number | null }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type IN ('INCOME','LOAN_RECEIVED') THEN CAST(amountBase AS REAL) ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type IN ('EXPENSE') THEN CAST(amountBase AS REAL) ELSE 0 END), 0) AS expense
     FROM transactions WHERE date >= ? AND date < ?`,
    [start, end]
  );
  const income = row?.income ?? 0;
  const expense = row?.expense ?? 0;
  return { income, expense, net: income - expense };
};

export const updateTransaction = async (row: Transaction): Promise<void> => {
  await db.runAsync(
    `UPDATE transactions SET
       type = ?, date = ?, amount = ?, currency = ?, amountBase = ?, baseCurrency = ?,
       exchangeRate = ?, accountId = ?, categoryId = ?, relatedTransactionId = ?,
       description = ?, source = ?, tags = ?, notes = ?, details = ?,
       isRecurring = ?, recurringRule = ?, recurringParentId = ?, status = ?, updatedAt = ?
     WHERE id = ?`,
    [
      row.type, row.date, row.amount, row.currency, row.amountBase, row.baseCurrency,
      row.exchangeRate, row.accountId, row.categoryId, row.relatedTransactionId,
      row.description, row.source, row.tags, row.notes, row.details,
      row.isRecurring, row.recurringRule, row.recurringParentId, row.status, Date.now(),
      row.id,
    ]
  );
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
};

/** Generate any overdue recurring transactions (call on app launch). */
export const processRecurringTransactions = async (): Promise<void> => {
  const now = Date.now();
  const recurring = await db.getAllAsync<Transaction>(
    `SELECT * FROM transactions WHERE isRecurring = 1 AND recurringParentId IS NULL`
  );

  for (const parent of recurring) {
    if (!parent.recurringRule) continue;
    const rule: RecurringRule = JSON.parse(parent.recurringRule);
    if (!rule.lastGeneratedDate) continue;

    const last = new Date(rule.lastGeneratedDate);
    const next = getNextDueDate(last, rule);
    if (next.getTime() > now) continue;

    // Check if already generated for this period
    const existing = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM transactions WHERE recurringParentId = ? AND date >= ?`,
      [parent.id, next.getTime()]
    );
    if (existing) continue;

    await createTransactionWithBalanceUpdate({
      type: parent.type,
      date: next.getTime(),
      amount: parent.amount,
      currency: parent.currency,
      amountBase: parent.amountBase,
      baseCurrency: parent.baseCurrency,
      exchangeRate: parent.exchangeRate,
      accountId: parent.accountId,
      categoryId: parent.categoryId,
      description: parent.description,
      source: parent.source,
      notes: parent.notes,
      isRecurring: false,
      recurringParentId: parent.id,
      status: 'cleared',
    });

    rule.lastGeneratedDate = next.toISOString();
    await db.runAsync(
      `UPDATE transactions SET recurringRule = ?, updatedAt = ? WHERE id = ?`,
      [JSON.stringify(rule), Date.now(), parent.id]
    );
  }
};

const getNextDueDate = (from: Date, rule: RecurringRule): Date => {
  const d = new Date(from);
  const n = rule.interval ?? 1;
  switch (rule.frequency) {
    case 'daily':   d.setDate(d.getDate() + n); break;
    case 'weekly':  d.setDate(d.getDate() + 7 * n); break;
    case 'monthly': d.setMonth(d.getMonth() + n); break;
    case 'yearly':  d.setFullYear(d.getFullYear() + n); break;
  }
  return d;
};

// Legacy helpers kept for chart components
export interface MonthlySeriesPoint {
  month: string;
  income: number;
  expense: number;
}

export const getMonthlyTotalsSeries = async (months: string[]): Promise<MonthlySeriesPoint[]> => {
  if (months.length === 0) return [];
  const { start } = monthRange(months[0]);
  const { end } = monthRange(months[months.length - 1]);
  const rows = await db.getAllAsync<{ month: string; income: number | null; expense: number | null }>(
    `SELECT strftime('%Y-%m', date / 1000, 'unixepoch', 'localtime') AS month,
       COALESCE(SUM(CASE WHEN type IN ('INCOME') THEN CAST(amountBase AS REAL) ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type IN ('EXPENSE') THEN CAST(amountBase AS REAL) ELSE 0 END), 0) AS expense
     FROM transactions WHERE date >= ? AND date < ?
     GROUP BY month`,
    [start, end]
  );
  const map = new Map(rows.map((r) => [r.month, r]));
  return months.map((m) => {
    const row = map.get(m);
    return { month: m, income: row?.income ?? 0, expense: row?.expense ?? 0 };
  });
};

export interface CategoryBreakdownRow {
  category_id: string | null;
  total: number;
}

export const getCategoryBreakdown = async (
  month: string,
  type: TransactionType
): Promise<CategoryBreakdownRow[]> => {
  const { start, end } = monthRange(month);
  return db.getAllAsync<CategoryBreakdownRow>(
    `SELECT categoryId AS category_id, SUM(CAST(amountBase AS REAL)) AS total
     FROM transactions
     WHERE date >= ? AND date < ? AND type = ?
     GROUP BY categoryId
     ORDER BY total DESC`,
    [start, end, type]
  );
};

// Legacy alias kept for components still using old name
export const getMonthlyTotals = async (month: string) => {
  const [year, m] = month.split('-').map(Number);
  return getMonthlySummary(year, m);
};
