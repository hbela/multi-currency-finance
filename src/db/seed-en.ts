import { db } from './db';
import { newId } from '../utils/id';

const EXPENSE_CATEGORIES = [
  { name: 'Groceries', icon: 'food' },
  { name: 'Transport', icon: 'car' },
  { name: 'Bills', icon: 'file-document' },
  { name: 'Entertainment', icon: 'gamepad-variant' },
  { name: 'Shopping', icon: 'cart' },
  { name: 'Health', icon: 'heart-pulse' },
  { name: 'Other Expense', icon: 'dots-horizontal' },
];

const INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'cash' },
  { name: 'Gift', icon: 'gift' },
  { name: 'Freelance', icon: 'laptop' },
  { name: 'Other Income', icon: 'plus-circle' },
];

const INVESTMENT_CATEGORIES = [
  { name: 'Stocks', icon: 'chart-line' },
  { name: 'Crypto', icon: 'bitcoin' },
  { name: 'Mutual Fund', icon: 'chart-bar' },
];

const LOAN_CATEGORIES = [
  { name: 'Personal Loan', icon: 'hand-coin' },
  { name: 'Mortgage', icon: 'home' },
];

const TRANSFER_CATEGORIES = [
  { name: 'Transfer', icon: 'bank-transfer' },
];

const ACCOUNTS = [
  { name: 'Chase Checking', type: 'bank', currency: 'USD', icon: 'bank', color: '#1565C0', balance: '0' },
  { name: 'Savings Account', type: 'bank', currency: 'USD', icon: 'piggy-bank', color: '#2E7D32', balance: '0' },
  { name: 'Revolut EUR', type: 'bank', currency: 'EUR', icon: 'credit-card', color: '#6A1B9A', balance: '0' },
  { name: 'Coinbase', type: 'crypto', currency: 'USDT', icon: 'bitcoin', color: '#F9A825', balance: '0' },
  { name: 'Cash', type: 'cash', currency: 'USD', icon: 'cash', color: '#558B2F', balance: '0' },
];

export const seedIfEmpty = async (): Promise<void> => {
  const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM categories');
  if ((row?.c ?? 0) > 0) return;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // ── Categories ────────────────────────────────────────────────────────────
  const catMap: Record<string, string> = {};

  const insertCats = async (list: { name: string; icon: string }[], type: string) => {
    for (const c of list) {
      const id = newId();
      await db.runAsync(
        'INSERT INTO categories (id, name, icon, type, isDefault, parentId, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, c.name, c.icon, type, 1, null, now]
      );
      catMap[c.name] = id;
    }
  };

  await insertCats(EXPENSE_CATEGORIES, 'EXPENSE');
  await insertCats(INCOME_CATEGORIES, 'INCOME');
  await insertCats(INVESTMENT_CATEGORIES, 'INVESTMENT_BUY');
  await insertCats(LOAN_CATEGORIES, 'LOAN_REPAYMENT');
  await insertCats(TRANSFER_CATEGORIES, 'TRANSFER');

  // ── Accounts ──────────────────────────────────────────────────────────────
  const accRow = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) AS c FROM accounts');
  if ((accRow?.c ?? 0) > 0) return;

  const accIds: Record<string, string> = {};
  for (const a of ACCOUNTS) {
    const id = newId();
    await db.runAsync(
      'INSERT INTO accounts (id, name, type, currency, balance, isActive, icon, color, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, a.name, a.type, a.currency, a.balance, 1, a.icon, a.color, null, now]
    );
    accIds[a.name] = id;
  }

  const checkingId = accIds['Chase Checking'];
  const savingsId  = accIds['Savings Account'];
  const cashId     = accIds['Cash'];

  // ── Helper ─────────────────────────────────────────────────────────────────
  const ALLOWED_TXN_COLUMNS = new Set([
    'id', 'type', 'date', 'amount', 'currency', 'amountBase', 'baseCurrency',
    'exchangeRate', 'accountId', 'categoryId', 'relatedTransactionId',
    'description', 'source', 'tags', 'notes', 'details', 'isRecurring',
    'recurringRule', 'recurringParentId', 'status', 'createdAt', 'updatedAt',
  ]);

  const insertTxn = async (fields: Record<string, unknown>) => {
    const cols = Object.keys(fields);
    const unknown = cols.filter(c => !ALLOWED_TXN_COLUMNS.has(c));
    if (unknown.length > 0) throw new Error(`insertTxn: unknown column(s): ${unknown.join(', ')}`);
    const placeholders = cols.map(() => '?').join(', ');
    await db.runAsync(
      `INSERT INTO transactions (${cols.join(', ')}) VALUES (${placeholders})`,
      cols.map(c => fields[c]) as (string | number | null)[]
    );
  };

  // ── Sample transactions ────────────────────────────────────────────────────
  // Grocery run — cash
  await insertTxn({
    id: newId(), type: 'EXPENSE', date: now - 1 * day,
    amount: '87.45', currency: 'USD', amountBase: '87.45', baseCurrency: 'USD', exchangeRate: '1',
    accountId: cashId, categoryId: catMap['Groceries'],
    description: 'Weekly grocery run', source: 'Whole Foods', tags: null, notes: null,
    details: JSON.stringify({ merchant: 'Whole Foods' }),
    isRecurring: 0, recurringRule: null, recurringParentId: null,
    status: 'cleared', relatedTransactionId: null, createdAt: now, updatedAt: now,
  });

  // Streaming subscription — checking
  await insertTxn({
    id: newId(), type: 'EXPENSE', date: now - 2 * day,
    amount: '15.99', currency: 'USD', amountBase: '15.99', baseCurrency: 'USD', exchangeRate: '1',
    accountId: checkingId, categoryId: catMap['Entertainment'],
    description: 'Netflix subscription', source: 'Netflix', tags: null, notes: null,
    details: JSON.stringify({ provider: 'Netflix', plan: 'Standard' }),
    isRecurring: 0, recurringRule: null, recurringParentId: null,
    status: 'cleared', relatedTransactionId: null, createdAt: now, updatedAt: now,
  });

  // Monthly salary — checking
  await insertTxn({
    id: newId(), type: 'INCOME', date: now - 5 * day,
    amount: '4500.00', currency: 'USD', amountBase: '4500.00', baseCurrency: 'USD', exchangeRate: '1',
    accountId: checkingId, categoryId: catMap['Salary'],
    description: 'April salary', source: 'Acme Corp', tags: null, notes: null,
    details: JSON.stringify({ payer: 'Acme Corp', is_taxable: 1 }),
    isRecurring: 0, recurringRule: null, recurringParentId: null,
    status: 'cleared', relatedTransactionId: null, createdAt: now, updatedAt: now,
  });

  // Stock purchase — checking
  await insertTxn({
    id: newId(), type: 'INVESTMENT_BUY', date: now - 6 * day,
    amount: '500.00', currency: 'USD', amountBase: '500.00', baseCurrency: 'USD', exchangeRate: '1',
    accountId: checkingId, categoryId: catMap['Stocks'],
    description: 'Apple shares', source: null, tags: null, notes: null,
    details: JSON.stringify({ security_name: 'Apple Inc.', symbol: 'AAPL', quantity: 3, price: 166.67, fee: 1 }),
    isRecurring: 0, recurringRule: null, recurringParentId: null,
    status: 'cleared', relatedTransactionId: null, createdAt: now, updatedAt: now,
  });

  // Mortgage repayment — checking
  await insertTxn({
    id: newId(), type: 'LOAN_REPAYMENT', date: now - 10 * day,
    amount: '1200.00', currency: 'USD', amountBase: '1200.00', baseCurrency: 'USD', exchangeRate: '1',
    accountId: checkingId, categoryId: catMap['Mortgage'],
    description: 'Monthly mortgage payment', source: null, tags: null, notes: null,
    details: JSON.stringify({ creditor: 'Wells Fargo', debt_type: 'mortgage', interest_rate: 6.5, remaining_term: 240 }),
    isRecurring: 0, recurringRule: null, recurringParentId: null,
    status: 'cleared', relatedTransactionId: null, createdAt: now, updatedAt: now,
  });

  // Freelance income — savings
  await insertTxn({
    id: newId(), type: 'INCOME', date: now - 8 * day,
    amount: '350.00', currency: 'USD', amountBase: '350.00', baseCurrency: 'USD', exchangeRate: '1',
    accountId: savingsId, categoryId: catMap['Freelance'],
    description: 'Logo design project', source: 'Client: Startup XYZ', tags: null, notes: null,
    details: JSON.stringify({ payer: 'Startup XYZ', is_taxable: 1 }),
    isRecurring: 0, recurringRule: null, recurringParentId: null,
    status: 'cleared', relatedTransactionId: null, createdAt: now, updatedAt: now,
  });

  // Update account balances to match seed transactions
  // Chase Checking: +4500 salary -15.99 netflix -500 stocks -1200 mortgage = 2784.01
  await db.runAsync(`UPDATE accounts SET balance = '2784.01' WHERE id = ?`, [checkingId]);
  // Savings: +350 freelance
  await db.runAsync(`UPDATE accounts SET balance = '350.00' WHERE id = ?`, [savingsId]);
  // Cash: -87.45 groceries
  await db.runAsync(`UPDATE accounts SET balance = '-87.45' WHERE id = ?`, [cashId]);
};
