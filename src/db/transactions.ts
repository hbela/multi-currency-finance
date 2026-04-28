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
  // v7 transfer fields
  fromAccountId?: string | null;
  toAccountId?: string | null;
  receivedAmount?: string | null;
  country?: string | null;
  city?: string | null;
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

/** Atomically inserts a transaction and updates the account balance(s). */
export const createTransactionWithBalanceUpdate = async (
  input: CreateTransactionInput
): Promise<Transaction> => {
  const now = Date.now();
  const isTransfer = input.type === 'TRANSFER';
  const row: Transaction = {
    id: newId(),
    type: input.type,
    date: input.date,
    amount: input.amount,
    currency: input.currency,
    amountBase: input.amountBase,
    baseCurrency: input.baseCurrency,
    exchangeRate: input.exchangeRate,
    // For transfers, accountId is the fromAccount; toAccountId is the destination.
    accountId: isTransfer ? (input.fromAccountId ?? input.accountId) : input.accountId,
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
    fromAccountId: input.fromAccountId ?? null,
    toAccountId: input.toAccountId ?? null,
    receivedAmount: input.receivedAmount ?? null,
    country: input.country ?? null,
    city: input.city ?? null,
  };

  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO transactions (
         id, type, date, amount, currency, amountBase, baseCurrency, exchangeRate,
         accountId, categoryId, relatedTransactionId, description, source, tags,
         notes, details, isRecurring, recurringRule, recurringParentId, status,
         createdAt, updatedAt,
         fromAccountId, toAccountId, receivedAmount, country, city
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id, row.type, row.date, row.amount, row.currency, row.amountBase,
        row.baseCurrency, row.exchangeRate, row.accountId, row.categoryId,
        row.relatedTransactionId, row.description, row.source, row.tags,
        row.notes, row.details, row.isRecurring, row.recurringRule,
        row.recurringParentId, row.status, row.createdAt, row.updatedAt,
        row.fromAccountId, row.toAccountId, row.receivedAmount, row.country, row.city,
      ]
    );

    if (isTransfer) {
      // Debit from-account; credit to-account with receivedAmount (may differ for FX transfers)
      const fromId = input.fromAccountId ?? input.accountId;
      const toId = input.toAccountId;
      const sentAmt = parseFloat(input.amount);
      const receivedAmt = input.receivedAmount ? parseFloat(input.receivedAmount) : sentAmt;
      if (fromId) {
        db.runSync(
          `UPDATE accounts SET balance = CAST(CAST(balance AS REAL) - ? AS TEXT) WHERE id = ?`,
          [sentAmt, fromId]
        );
      }
      if (toId) {
        db.runSync(
          `UPDATE accounts SET balance = CAST(CAST(balance AS REAL) + ? AS TEXT) WHERE id = ?`,
          [receivedAmt, toId]
        );
      }
    } else if (input.accountId) {
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
       COALESCE(SUM(CASE WHEN type IN ('INCOME','LOAN_RECEIVED','INVESTMENT_SELL') THEN CAST(amountBase AS REAL) ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type IN ('EXPENSE','LOAN_REPAYMENT','INVESTMENT_BUY') THEN CAST(amountBase AS REAL) ELSE 0 END), 0) AS expense
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
       COALESCE(SUM(CASE WHEN type IN ('INCOME','LOAN_RECEIVED','INVESTMENT_SELL') THEN CAST(amountBase AS REAL) ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type IN ('EXPENSE','LOAN_REPAYMENT','INVESTMENT_BUY') THEN CAST(amountBase AS REAL) ELSE 0 END), 0) AS expense
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

const EXPENSE_TYPES = ['EXPENSE', 'LOAN_REPAYMENT', 'INVESTMENT_BUY'] as const;
const INCOME_TYPES  = ['INCOME', 'LOAN_RECEIVED', 'INVESTMENT_SELL'] as const;

export const getCategoryBreakdown = async (
  month: string,
  type: TransactionType
): Promise<CategoryBreakdownRow[]> => {
  const { start, end } = monthRange(month);
  const types = type === 'EXPENSE' ? EXPENSE_TYPES : type === 'INCOME' ? INCOME_TYPES : [type];
  const placeholders = types.map(() => '?').join(', ');
  return db.getAllAsync<CategoryBreakdownRow>(
    `SELECT categoryId AS category_id, SUM(CAST(amountBase AS REAL)) AS total
     FROM transactions
     WHERE date >= ? AND date < ? AND type IN (${placeholders})
     GROUP BY categoryId
     ORDER BY total DESC`,
    [start, end, ...types]
  );
};

// Legacy alias kept for components still using old name
export const getMonthlyTotals = async (month: string) => {
  const [year, m] = month.split('-').map(Number);
  return getMonthlySummary(year, m);
};

// ─── Week 5 queries ───────────────────────────────────────────────────────────

export interface DailyNetWorthPoint {
  date: string; // 'YYYY-MM-DD'
  amountBase: number;
}

/**
 * Returns one data point per calendar day for the last `days` days (default 30).
 * Each point is the cumulative sum of amountBase for all non-transfer transactions
 * up to and including that day — a running net-worth proxy.
 * Recomputed on-demand from the transactions table.
 */
export const getNetWorthHistory = async (days = 30): Promise<DailyNetWorthPoint[]> => {
  const points: DailyNetWorthPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(23, 59, 59, 999);
    const endOfDay = d.getTime();

    const row = await db.getFirstAsync<{ total: number | null }>(
      `SELECT COALESCE(SUM(
         CASE
           WHEN type IN ('INCOME','LOAN_RECEIVED','INVESTMENT_SELL') THEN CAST(amountBase AS REAL)
           WHEN type IN ('EXPENSE','LOAN_REPAYMENT','INVESTMENT_BUY') THEN -CAST(amountBase AS REAL)
           ELSE 0
         END
       ), 0) AS total
       FROM transactions
       WHERE date <= ? AND type != 'TRANSFER'`,
      [endOfDay]
    );

    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    points.push({ date: dateStr, amountBase: row?.total ?? 0 });
  }

  return points;
};

export interface AccountPnLRow {
  accountId: string;
  income: number;
  expense: number;
  net: number;
}

/** Per-account income / expense / net for a given month. */
export const getAccountPnL = async (month: string): Promise<AccountPnLRow[]> => {
  const { start, end } = monthRange(month);
  return db.getAllAsync<AccountPnLRow>(
    `SELECT
       accountId,
       COALESCE(SUM(CASE WHEN type IN ('INCOME','LOAN_RECEIVED','INVESTMENT_SELL') THEN CAST(amountBase AS REAL) ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type IN ('EXPENSE','LOAN_REPAYMENT','INVESTMENT_BUY') THEN CAST(amountBase AS REAL) ELSE 0 END), 0) AS expense,
       COALESCE(SUM(
         CASE
           WHEN type IN ('INCOME','LOAN_RECEIVED','INVESTMENT_SELL') THEN CAST(amountBase AS REAL)
           WHEN type IN ('EXPENSE','LOAN_REPAYMENT','INVESTMENT_BUY') THEN -CAST(amountBase AS REAL)
           ELSE 0
         END
       ), 0) AS net
     FROM transactions
     WHERE date >= ? AND date < ? AND accountId IS NOT NULL
     GROUP BY accountId
     ORDER BY ABS(net) DESC`,
    [start, end]
  );
};

export interface CountrySpendRow {
  country: string;
  city: string | null;
  total: number;
}

/** Country + city spending breakdown for a given month (EXPENSE-type transactions only). */
export const getCountrySpending = async (month: string): Promise<CountrySpendRow[]> => {
  const { start, end } = monthRange(month);
  return db.getAllAsync<CountrySpendRow>(
    `SELECT
       COALESCE(country, 'Unknown') AS country,
       city,
       SUM(CAST(amountBase AS REAL)) AS total
     FROM transactions
     WHERE date >= ? AND date < ?
       AND type IN ('EXPENSE','LOAN_REPAYMENT','INVESTMENT_BUY')
       AND (country IS NOT NULL OR city IS NOT NULL)
     GROUP BY country, city
     ORDER BY total DESC`,
    [start, end]
  );
};
