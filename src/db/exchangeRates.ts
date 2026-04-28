import { db } from './db';
import { ExchangeRate } from '../types';
import { newId } from '../utils/id';

/** Get the most recent rate for a pair on or before atDate (defaults to now). */
export const getRate = (
  fromCode: string,
  toCode: string,
  atDate = Date.now()
): Promise<ExchangeRate | null> =>
  db
    .getFirstAsync<ExchangeRate>(
      `SELECT * FROM exchange_rates
       WHERE fromCode = ? AND toCode = ? AND date <= ?
       ORDER BY date DESC LIMIT 1`,
      [fromCode, toCode, atDate]
    )
    .then((r) => r ?? null);

export const upsertRate = async (
  input: Omit<ExchangeRate, 'id' | 'created_at'>
): Promise<ExchangeRate> => {
  const existing = await getRate(input.fromCode, input.toCode, input.date);
  // Only insert a new row if the date differs; otherwise replace the same-day rate.
  const id = existing?.date === input.date ? existing.id : newId();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO exchange_rates (id, fromCode, toCode, rate, source, date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(fromCode, toCode, date) DO UPDATE SET
       rate = excluded.rate,
       source = excluded.source`,
    [id, input.fromCode, input.toCode, input.rate, input.source, input.date, now]
  );
  return { ...input, id, created_at: now };
};

export const listRates = (): Promise<ExchangeRate[]> =>
  db.getAllAsync<ExchangeRate>(
    'SELECT * FROM exchange_rates ORDER BY date DESC, fromCode ASC'
  );

/** One row per currency pair — the most recent rate for each. */
export const getLatestRates = (): Promise<ExchangeRate[]> =>
  db.getAllAsync<ExchangeRate>(
    `SELECT er.*
     FROM exchange_rates er
     INNER JOIN (
       SELECT fromCode, toCode, MAX(date) AS maxDate
       FROM exchange_rates
       GROUP BY fromCode, toCode
     ) latest ON er.fromCode = latest.fromCode
             AND er.toCode   = latest.toCode
             AND er.date     = latest.maxDate
     ORDER BY er.fromCode ASC, er.toCode ASC`
  );

export const deleteRate = async (id: string): Promise<void> => {
  await db.runAsync('DELETE FROM exchange_rates WHERE id = ?', [id]);
};
