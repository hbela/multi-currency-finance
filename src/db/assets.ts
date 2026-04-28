import { db } from './db';
import { Asset, AssetClass } from '../types';
import { generateId } from '../utils/id';

export const listAssets = (): Promise<Asset[]> =>
  db.getAllAsync<Asset>('SELECT * FROM assets ORDER BY assetClass ASC, symbol ASC');

export const getAsset = (id: string): Promise<Asset | null> =>
  db
    .getFirstAsync<Asset>('SELECT * FROM assets WHERE id = ?', [id])
    .then((r) => r ?? null);

export const getAssetBySymbol = (symbol: string, currency: string): Promise<Asset | null> =>
  db
    .getFirstAsync<Asset>(
      'SELECT * FROM assets WHERE symbol = ? AND currency = ?',
      [symbol, currency]
    )
    .then((r) => r ?? null);

export interface CreateAssetInput {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  currency: string;
  exchange?: string | null;
}

export const createAsset = async (input: CreateAssetInput): Promise<Asset> => {
  const id = generateId();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO assets (id, symbol, name, assetClass, currency, exchange, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.symbol.toUpperCase(), input.name, input.assetClass, input.currency, input.exchange ?? null, now]
  );
  return (await getAsset(id))!;
};

export const updateAsset = async (id: string, input: Partial<CreateAssetInput>): Promise<void> => {
  const fields: string[] = [];
  const values: (string | null)[] = [];
  if (input.symbol !== undefined) { fields.push('symbol = ?'); values.push(input.symbol.toUpperCase()); }
  if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
  if (input.assetClass !== undefined) { fields.push('assetClass = ?'); values.push(input.assetClass); }
  if (input.currency !== undefined) { fields.push('currency = ?'); values.push(input.currency); }
  if (input.exchange !== undefined) { fields.push('exchange = ?'); values.push(input.exchange ?? null); }
  if (fields.length === 0) return;
  await db.runAsync(`UPDATE assets SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
};

export const deleteAsset = async (id: string): Promise<void> => {
  await db.runAsync('DELETE FROM assets WHERE id = ?', [id]);
};
