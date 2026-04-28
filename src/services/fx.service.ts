/**
 * FX Service — pure currency conversion logic.
 *
 * Strategy for convertAmount(from → to):
 *   1. Try direct pair (from → to)
 *   2. Try inverse pair (to → from), invert the rate
 *   3. Try triangulation via base currency (from → base → to)
 *   4. Fail-soft: return original amount with a console.warn
 *
 * No Intl.NumberFormat — Hermes on Android has incomplete Intl support.
 * All arithmetic uses parseFloat + Math.round to avoid floating-point drift.
 */

import { getRate, getLatestRates } from '../db/exchangeRates';
import { getBaseCurrency } from '../db/currencies';
import { getLedgerBalanceForAccount } from '../db/ledger';

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Convert an amount between two currency codes using stored exchange rates. */
export const convertAmount = async (
  amount: number,
  fromCode: string,
  toCode: string,
  atDate = Date.now()
): Promise<number> => {
  if (fromCode === toCode) return amount;

  // 1. Direct pair
  const direct = await getRate(fromCode, toCode, atDate);
  if (direct) return round2(amount * parseFloat(direct.rate));

  // 2. Inverse pair
  const inverse = await getRate(toCode, fromCode, atDate);
  if (inverse) {
    const inverseRate = parseFloat(inverse.rate);
    if (inverseRate !== 0) return round2(amount / inverseRate);
  }

  // 3. Triangulate via base currency
  const base = await getBaseCurrency();
  if (base && base.code !== fromCode && base.code !== toCode) {
    const toBase = await getRate(fromCode, base.code, atDate);
    const fromBase = await getRate(base.code, toCode, atDate);
    if (toBase && fromBase) {
      return round2(amount * parseFloat(toBase.rate) * parseFloat(fromBase.rate));
    }
    // Try inverse legs
    const fromBaseInv = await getRate(toCode, base.code, atDate);
    const toBaseInv = await getRate(base.code, fromCode, atDate);
    if (fromBaseInv && toBaseInv) {
      const rate1 = parseFloat(toBaseInv.rate);
      const rate2 = parseFloat(fromBaseInv.rate);
      if (rate1 !== 0 && rate2 !== 0) {
        return round2(amount / rate1 / rate2);
      }
    }
  }

  console.warn(`[fx] No rate found for ${fromCode} → ${toCode}. Returning original amount.`);
  return amount;
};

/** Returns a rate as a decimal string, or '1' when currencies are the same. */
export const getRateString = async (
  fromCode: string,
  toCode: string,
  atDate = Date.now()
): Promise<string> => {
  if (fromCode === toCode) return '1';
  const rate = await getRate(fromCode, toCode, atDate);
  if (rate) return rate.rate;
  const inverse = await getRate(toCode, fromCode, atDate);
  if (inverse) {
    const r = parseFloat(inverse.rate);
    return r !== 0 ? String(round2(1 / r)) : '1';
  }
  return '1';
};

/** Convert an amount to the base currency. */
export const toBaseCurrency = async (
  amount: number,
  fromCode: string,
  atDate = Date.now()
): Promise<number> => {
  const base = await getBaseCurrency();
  if (!base) return amount;
  return convertAmount(amount, fromCode, base.code, atDate);
};

/**
 * Compute net worth in base currency by summing all account ledger balances
 * and converting each to the base currency.
 */
export const computeNetWorthInBase = async (
  accounts: Array<{ id: string; currency: string }>,
  atDate = Date.now()
): Promise<number> => {
  let total = 0;
  for (const account of accounts) {
    const balanceStr = await getLedgerBalanceForAccount(account.id);
    const balance = parseFloat(balanceStr);
    if (isNaN(balance) || balance === 0) continue;
    const inBase = await toBaseCurrency(balance, account.currency, atDate);
    total += inBase;
  }
  return round2(total);
};

/**
 * Load all latest rates into a simple lookup map for batch conversions.
 * Returns a map keyed as "FROM_TO" → rate number.
 */
export const buildRateMap = async (): Promise<Record<string, number>> => {
  const rates = await getLatestRates();
  const map: Record<string, number> = {};
  for (const r of rates) {
    map[`${r.fromCode}_${r.toCode}`] = parseFloat(r.rate);
  }
  return map;
};

/** Sync version using a pre-built rate map — for use in hot render paths. */
export const convertWithMap = (
  amount: number,
  fromCode: string,
  toCode: string,
  rateMap: Record<string, number>
): number => {
  if (fromCode === toCode) return amount;
  const direct = rateMap[`${fromCode}_${toCode}`];
  if (direct !== undefined) return round2(amount * direct);
  const inverse = rateMap[`${toCode}_${fromCode}`];
  if (inverse !== undefined && inverse !== 0) return round2(amount / inverse);
  console.warn(`[fx] No rate in map for ${fromCode} → ${toCode}`);
  return amount;
};
