import { db } from './db';
import { Holding, HoldingWithAsset } from '../types';
import { generateId } from '../utils/id';

export const listHoldings = (): Promise<Holding[]> =>
  db.getAllAsync<Holding>('SELECT * FROM holdings ORDER BY created_at DESC');

interface HoldingJoinRow {
  id: string;
  assetId: string;
  accountId: string;
  quantity: string;
  avgCostBasis: string;
  created_at: number;
  updated_at: number;
  assetSymbol: string;
  assetName: string;
  assetClass: string;
  assetCurrency: string;
  assetExchange: string | null;
  assetCreatedAt: number;
}

export const listHoldingsWithAsset = (): Promise<HoldingWithAsset[]> =>
  db
    .getAllAsync<HoldingJoinRow>(
      `SELECT
         h.*,
         a.symbol     AS assetSymbol,
         a.name       AS assetName,
         a.assetClass AS assetClass,
         a.currency   AS assetCurrency,
         a.exchange   AS assetExchange,
         a.created_at AS assetCreatedAt
       FROM holdings h
       JOIN assets a ON a.id = h.assetId
       ORDER BY a.assetClass ASC, a.symbol ASC`
    )
    .then((rows) =>
      rows.map((r) => ({
        id: r.id,
        assetId: r.assetId,
        accountId: r.accountId,
        quantity: r.quantity,
        avgCostBasis: r.avgCostBasis,
        created_at: r.created_at,
        updated_at: r.updated_at,
        asset: {
          id: r.assetId,
          symbol: r.assetSymbol,
          name: r.assetName,
          assetClass: r.assetClass as import('../types').AssetClass,
          currency: r.assetCurrency,
          exchange: r.assetExchange,
          created_at: r.assetCreatedAt,
        },
      }))
    );

export const getHolding = (id: string): Promise<Holding | null> =>
  db
    .getFirstAsync<Holding>('SELECT * FROM holdings WHERE id = ?', [id])
    .then((r) => r ?? null);

export const getHoldingForAssetAccount = (assetId: string, accountId: string): Promise<Holding | null> =>
  db
    .getFirstAsync<Holding>(
      'SELECT * FROM holdings WHERE assetId = ? AND accountId = ?',
      [assetId, accountId]
    )
    .then((r) => r ?? null);

export interface CreateHoldingInput {
  assetId: string;
  accountId: string;
  quantity: string;
  avgCostBasis: string;
}

export const createHolding = async (input: CreateHoldingInput): Promise<Holding> => {
  const id = generateId();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO holdings (id, assetId, accountId, quantity, avgCostBasis, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.assetId, input.accountId, input.quantity, input.avgCostBasis, now, now]
  );
  return (await getHolding(id))!;
};

export const updateHolding = async (id: string, input: Partial<CreateHoldingInput>): Promise<void> => {
  const now = Date.now();
  const fields: string[] = ['updated_at = ?'];
  const values: (string | number)[] = [now];
  if (input.quantity !== undefined) { fields.push('quantity = ?'); values.push(input.quantity); }
  if (input.avgCostBasis !== undefined) { fields.push('avgCostBasis = ?'); values.push(input.avgCostBasis); }
  await db.runAsync(`UPDATE holdings SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
};

export const deleteHolding = async (id: string): Promise<void> => {
  await db.runAsync('DELETE FROM holdings WHERE id = ?', [id]);
};

/**
 * Upsert a holding after a BUY or SELL transaction.
 * BUY: weighted-average cost basis; quantity += qty.
 * SELL: quantity -= qty (cost basis unchanged); delete if quantity reaches 0.
 */
export const applyHoldingTransaction = async (
  assetId: string,
  accountId: string,
  qty: number,
  pricePerUnit: number,
  isBuy: boolean
): Promise<void> => {
  const existing = await getHoldingForAssetAccount(assetId, accountId);
  if (isBuy) {
    if (!existing) {
      await createHolding({
        assetId,
        accountId,
        quantity: String(qty),
        avgCostBasis: String(pricePerUnit),
      });
    } else {
      const oldQty = parseFloat(existing.quantity);
      const oldCost = parseFloat(existing.avgCostBasis);
      const newQty = oldQty + qty;
      const newCost = (oldQty * oldCost + qty * pricePerUnit) / newQty;
      await updateHolding(existing.id, {
        quantity: String(Math.round(newQty * 1e8) / 1e8),
        avgCostBasis: String(Math.round(newCost * 1e8) / 1e8),
      });
    }
  } else {
    if (!existing) return;
    const oldQty = parseFloat(existing.quantity);
    const newQty = Math.max(0, oldQty - qty);
    if (newQty === 0) {
      await deleteHolding(existing.id);
    } else {
      await updateHolding(existing.id, { quantity: String(Math.round(newQty * 1e8) / 1e8) });
    }
  }
};
