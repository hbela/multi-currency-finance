import { db } from './db';
import { Currency } from '../types';

export const listCurrencies = (): Promise<Currency[]> =>
  db.getAllAsync<Currency>(
    'SELECT * FROM currencies WHERE isActive = 1 ORDER BY code ASC'
  );

export const getCurrency = (code: string): Promise<Currency | null> =>
  db
    .getFirstAsync<Currency>('SELECT * FROM currencies WHERE code = ?', [code])
    .then((r) => r ?? null);

export const getBaseCurrency = (): Promise<Currency | null> =>
  db
    .getFirstAsync<Currency>('SELECT * FROM currencies WHERE isBase = 1 LIMIT 1')
    .then((r) => r ?? null);

export const upsertCurrency = async (
  input: Omit<Currency, 'created_at'>
): Promise<void> => {
  await db.runAsync(
    `INSERT INTO currencies (code, name, symbol, decimals, isBase, isActive, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET
       name = excluded.name,
       symbol = excluded.symbol,
       decimals = excluded.decimals,
       isBase = excluded.isBase,
       isActive = excluded.isActive`,
    [
      input.code,
      input.name,
      input.symbol,
      input.decimals,
      input.isBase,
      input.isActive,
      Date.now(),
    ]
  );
};

/** Set a currency as the base currency (only one can be base at a time). */
export const setBaseCurrency = async (code: string): Promise<void> => {
  await db.runAsync('UPDATE currencies SET isBase = 0');
  await db.runAsync('UPDATE currencies SET isBase = 1 WHERE code = ?', [code]);
};
