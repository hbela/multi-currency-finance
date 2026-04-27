import { db } from './db';
import { newId } from '../utils/id';

const EXPENSE_CATEGORIES = [
  { name: 'Élelmiszer', icon: 'food' },
  { name: 'Közlekedés', icon: 'car' },
  { name: 'Számlák', icon: 'file-document' },
  { name: 'Szórakozás', icon: 'gamepad-variant' },
  { name: 'Vásárlás', icon: 'cart' },
  { name: 'Egészség', icon: 'heart-pulse' },
  { name: 'Egyéb kiadás', icon: 'dots-horizontal' },
];

const INCOME_CATEGORIES = [
  { name: 'Fizetés', icon: 'cash' },
  { name: 'Ajándék', icon: 'gift' },
  { name: 'Freelance', icon: 'laptop' },
  { name: 'Egyéb bevétel', icon: 'plus-circle' },
];

const INVESTMENT_CATEGORIES = [
  { name: 'Részvény', icon: 'chart-line' },
  { name: 'Kripto', icon: 'bitcoin' },
  { name: 'Befektetési alap', icon: 'chart-bar' },
];

const LOAN_CATEGORIES = [
  { name: 'Személyi kölcsön', icon: 'hand-coin' },
  { name: 'Jelzáloghitel', icon: 'home' },
];

const TRANSFER_CATEGORIES = [
  { name: 'Átutalás', icon: 'bank-transfer' },
];

const ACCOUNTS = [
  { name: 'OTP Bankszámla', type: 'bank', currency: 'HUF', icon: 'bank', color: '#1565C0', balance: '0' },
  { name: 'Wise USD', type: 'bank', currency: 'USD', icon: 'currency-usd', color: '#2E7D32', balance: '0' },
  { name: 'Revolut EUR', type: 'bank', currency: 'EUR', icon: 'credit-card', color: '#6A1B9A', balance: '0' },
  { name: 'Binance', type: 'crypto', currency: 'USDT', icon: 'bitcoin', color: '#F9A825', balance: '0' },
  { name: 'Készpénz', type: 'cash', currency: 'HUF', icon: 'cash', color: '#558B2F', balance: '0' },
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

  const otpId = accIds['OTP Bankszámla'];
  const wiseId = accIds['Wise USD'];
  const cashId = accIds['Készpénz'];

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
  // HUF expense
  await insertTxn({
    id: newId(), type: 'EXPENSE', date: now - 1 * day,
    amount: '4850', currency: 'HUF', amountBase: '4850', baseCurrency: 'HUF', exchangeRate: '1',
    accountId: cashId, categoryId: catMap['Élelmiszer'],
    description: 'Heti bevásárlás', source: 'Lidl', tags: null, notes: null,
    details: JSON.stringify({ merchant: 'Lidl' }),
    isRecurring: 0, recurringRule: null, recurringParentId: null,
    status: 'cleared', relatedTransactionId: null, createdAt: now, updatedAt: now,
  });

  // USD expense (foreign currency)
  await insertTxn({
    id: newId(), type: 'EXPENSE', date: now - 2 * day,
    amount: '29.99', currency: 'USD', amountBase: '11396', baseCurrency: 'HUF', exchangeRate: '380',
    accountId: wiseId, categoryId: catMap['Szórakozás'],
    description: 'Netflix előfizetés', source: 'Netflix', tags: null, notes: null,
    details: JSON.stringify({ provider: 'Netflix', plan: 'Standard' }),
    isRecurring: 0, recurringRule: null, recurringParentId: null,
    status: 'cleared', relatedTransactionId: null, createdAt: now, updatedAt: now,
  });

  // HUF income (salary)
  await insertTxn({
    id: newId(), type: 'INCOME', date: now - 5 * day,
    amount: '450000', currency: 'HUF', amountBase: '450000', baseCurrency: 'HUF', exchangeRate: '1',
    accountId: otpId, categoryId: catMap['Fizetés'],
    description: 'Április havi fizetés', source: 'Munkáltató Kft.', tags: null, notes: null,
    details: JSON.stringify({ payer: 'Munkáltató Kft.', is_taxable: 1 }),
    isRecurring: 0, recurringRule: null, recurringParentId: null,
    status: 'cleared', relatedTransactionId: null, createdAt: now, updatedAt: now,
  });

  // Investment buy
  await insertTxn({
    id: newId(), type: 'INVESTMENT_BUY', date: now - 6 * day,
    amount: '100000', currency: 'HUF', amountBase: '100000', baseCurrency: 'HUF', exchangeRate: '1',
    accountId: otpId, categoryId: catMap['Részvény'],
    description: 'OTP részvény vétel', source: null, tags: null, notes: null,
    details: JSON.stringify({ security_name: 'OTP Bank Nyrt.', symbol: 'OTP', quantity: 20, price: 5000, fee: 500 }),
    isRecurring: 0, recurringRule: null, recurringParentId: null,
    status: 'cleared', relatedTransactionId: null, createdAt: now, updatedAt: now,
  });

  // Loan repayment
  await insertTxn({
    id: newId(), type: 'LOAN_REPAYMENT', date: now - 10 * day,
    amount: '45000', currency: 'HUF', amountBase: '45000', baseCurrency: 'HUF', exchangeRate: '1',
    accountId: otpId, categoryId: catMap['Személyi kölcsön'],
    description: 'Havi törlesztő', source: null, tags: null, notes: null,
    details: JSON.stringify({ creditor: 'OTP Bank', debt_type: 'personal_loan', interest_rate: 8.5, remaining_term: 24 }),
    isRecurring: 0, recurringRule: null, recurringParentId: null,
    status: 'cleared', relatedTransactionId: null, createdAt: now, updatedAt: now,
  });

  // Update account balances to match seed transactions
  // OTP: +450000 income -100000 invest_buy -45000 loan_repayment = 305000
  await db.runAsync(`UPDATE accounts SET balance = '305000' WHERE id = ?`, [otpId]);
  // Wise: -29.99 (USD)
  await db.runAsync(`UPDATE accounts SET balance = '-29.99' WHERE id = ?`, [wiseId]);
  // Cash: -4850 expense
  await db.runAsync(`UPDATE accounts SET balance = '-4850' WHERE id = ?`, [cashId]);
};
