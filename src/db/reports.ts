import { db } from './db';
import { CategorySpending, InvestmentHolding, MonthlySeriesPoint } from '../types';
import { monthRange } from '../utils/date';

export const getCategorySpending = async (
  year: number,
  month: number
): Promise<CategorySpending[]> => {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const { start, end } = monthRange(monthStr);
  return db.getAllAsync<CategorySpending>(
    `SELECT
       t.categoryId,
       COALESCE(c.name, 'Uncategorised') AS categoryName,
       SUM(CAST(t.amountBase AS REAL)) AS total
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.categoryId
     WHERE t.date >= ? AND t.date < ?
       AND t.type IN ('EXPENSE' /*, 'CREDIT_CARD_PAYMENT' */)
     GROUP BY t.categoryId
     ORDER BY total DESC`,
    [start, end]
  );
};

export const getMonthlyTrends = async (months: string[]): Promise<MonthlySeriesPoint[]> => {
  if (months.length === 0) return [];
  const { start } = monthRange(months[0]);
  const { end } = monthRange(months[months.length - 1]);
  const rows = await db.getAllAsync<{ month: string; income: number | null; expense: number | null }>(
    `SELECT strftime('%Y-%m', date / 1000, 'unixepoch', 'localtime') AS month,
       COALESCE(SUM(CASE WHEN type IN ('INCOME','LOAN_RECEIVED') THEN CAST(amountBase AS REAL) ELSE 0 END), 0) AS income,
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

export const getInvestmentHoldings = async (): Promise<InvestmentHolding[]> => {
  const rows = await db.getAllAsync<{
    symbol: string | null;
    name: string | null;
    currency: string;
    bought: number | null;
    sold: number | null;
    avgPrice: number | null;
  }>(
    `SELECT
       json_extract(details, '$.symbol') AS symbol,
       json_extract(details, '$.security_name') AS name,
       currency,
       SUM(CASE WHEN type = 'INVESTMENT_BUY'  THEN CAST(json_extract(details, '$.quantity') AS REAL) ELSE 0 END) AS bought,
       SUM(CASE WHEN type = 'INVESTMENT_SELL' THEN CAST(json_extract(details, '$.quantity') AS REAL) ELSE 0 END) AS sold,
       AVG(CASE WHEN type = 'INVESTMENT_BUY'  THEN CAST(json_extract(details, '$.price') AS REAL) END) AS avgPrice
     FROM transactions
     WHERE type IN ('INVESTMENT_BUY', 'INVESTMENT_SELL')
       AND json_extract(details, '$.symbol') IS NOT NULL
     GROUP BY symbol, currency`
  );

  return rows
    .filter((r) => r.symbol && (r.bought ?? 0) - (r.sold ?? 0) > 0)
    .map((r) => ({
      symbol: r.symbol!,
      name: r.name ?? r.symbol!,
      quantity: (r.bought ?? 0) - (r.sold ?? 0),
      avgPrice: r.avgPrice ?? 0,
      currency: r.currency,
    }));
};
