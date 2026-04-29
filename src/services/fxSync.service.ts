/**
 * Auto FX Sync — fetches latest exchange rates from Open Exchange Rates (free tier).
 *
 * Free tier returns all rates relative to USD as the base. We store each pair
 * (USD→X) and derive (X→USD) via the inverse; the FX service will triangulate
 * any other pair through the base currency.
 *
 * Settings keys used:
 *   fx_auto_enabled  — "true" | "false"
 *   fx_api_key       — Open Exchange Rates App ID
 *   fx_last_sync     — epoch ms string of last successful sync
 */

import { getSetting, setSetting } from '../db/settings';
import { upsertRate } from '../db/exchangeRates';

const OER_URL = 'https://openexchangerates.org/api/latest.json';

export interface FxSyncResult {
  synced: number;
  error?: string;
}

/**
 * Fetch the latest USD-based rates from Open Exchange Rates and store them.
 * Only stores pairs involving currencies already relevant to the user, but in
 * practice the free tier returns ~170 currencies — we store all of them so the
 * FX service can triangulate any pair.
 */
export async function syncFxRates(apiKey: string): Promise<FxSyncResult> {
  const url = `${OER_URL}?app_id=${encodeURIComponent(apiKey)}&prettyprint=false`;
  let json: { base?: string; rates?: Record<string, number>; error?: boolean; description?: string };

  try {
    const res = await fetch(url);
    json = await res.json();
  } catch (e) {
    return { synced: 0, error: e instanceof Error ? e.message : 'Network error' };
  }

  if (json.error) {
    return { synced: 0, error: json.description ?? 'API error' };
  }

  const base = json.base ?? 'USD';
  const rates = json.rates;
  if (!rates) {
    return { synced: 0, error: 'No rates in response' };
  }

  const today = new Date();
  // Store as epoch ms for midnight UTC of today
  const dateMs =
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  let synced = 0;
  for (const [code, rate] of Object.entries(rates)) {
    if (typeof rate !== 'number' || rate <= 0) continue;
    await upsertRate({
      fromCode: base,
      toCode: code,
      rate: String(rate),
      source: 'api',
      date: dateMs,
    });
    synced++;
  }

  await setSetting('fx_last_sync', String(Date.now()));
  return { synced };
}

export async function getFxAutoEnabled(): Promise<boolean> {
  const val = await getSetting('fx_auto_enabled');
  return val === 'true';
}

export async function setFxAutoEnabled(enabled: boolean): Promise<void> {
  await setSetting('fx_auto_enabled', enabled ? 'true' : 'false');
}

export async function getFxApiKey(): Promise<string> {
  return (await getSetting('fx_api_key')) ?? '';
}

export async function setFxApiKey(key: string): Promise<void> {
  await setSetting('fx_api_key', key.trim());
}

export async function getFxLastSync(): Promise<number | null> {
  const val = await getSetting('fx_last_sync');
  const n = val ? parseInt(val, 10) : NaN;
  return isNaN(n) ? null : n;
}
