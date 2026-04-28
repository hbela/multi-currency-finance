import { db } from './db';
import { LedgerEntry } from '../types';
import { newId } from '../utils/id';

/**
 * Bulk-insert ledger entries inside a caller-managed withTransactionSync block.
 * Each entry gets a fresh nanoid and the current timestamp.
 */
export const insertLedgerEntries = (
  entries: Omit<LedgerEntry, 'id' | 'created_at'>[]
): void => {
  const now = Date.now();
  for (const e of entries) {
    db.runSync(
      `INSERT INTO ledger_entries
         (id, transactionId, accountId, amount, currency, amountBase, baseCurrency, exchangeRate, entryType, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId(),
        e.transactionId,
        e.accountId,
        e.amount,
        e.currency,
        e.amountBase,
        e.baseCurrency,
        e.exchangeRate,
        e.entryType,
        now,
      ]
    );
  }
};

/** Derived balance for an account: SUM of all signed ledger amounts. Returns a TEXT string. */
export const getLedgerBalanceForAccount = async (
  accountId: string
): Promise<string> => {
  const row = await db.getFirstAsync<{ total: number | null }>(
    `SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) AS total
     FROM ledger_entries WHERE accountId = ?`,
    [accountId]
  );
  const total = row?.total ?? 0;
  return String(Math.round(total * 100) / 100);
};

export const getLedgerEntriesForTransaction = (
  transactionId: string
): Promise<LedgerEntry[]> =>
  db.getAllAsync<LedgerEntry>(
    'SELECT * FROM ledger_entries WHERE transactionId = ? ORDER BY created_at ASC',
    [transactionId]
  );

/** Called during deleteTransaction to maintain ledger integrity. */
export const deleteLedgerEntriesForTransaction = (transactionId: string): void => {
  db.runSync('DELETE FROM ledger_entries WHERE transactionId = ?', [transactionId]);
};
