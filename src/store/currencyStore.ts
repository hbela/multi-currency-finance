import { create } from 'zustand';
import { Currency } from '../types';
import {
  listCurrencies,
  getCurrency,
  upsertCurrency,
  setBaseCurrency,
} from '../db/currencies';

interface CurrencyStore {
  items: Currency[];
  base: Currency | null;
  loading: boolean;
  load: () => Promise<void>;
  upsert: (input: Omit<Currency, 'created_at'>) => Promise<void>;
  setBase: (code: string) => Promise<void>;
  getByCode: (code: string) => Currency | undefined;
}

export const useCurrencyStore = create<CurrencyStore>((set, get) => ({
  items: [],
  base: null,
  loading: false,

  load: async () => {
    set({ loading: true });
    try {
      const items = await listCurrencies();
      const base = items.find((c) => c.isBase === 1) ?? null;
      set({ items, base, loading: false });
    } catch (e) {
      set({ loading: false });
      console.error('[currencyStore] load failed:', e);
    }
  },

  upsert: async (input) => {
    await upsertCurrency(input);
    const fresh = await getCurrency(input.code);
    if (!fresh) return;
    const items = get().items.some((c) => c.code === fresh.code)
      ? get().items.map((c) => (c.code === fresh.code ? fresh : c))
      : [...get().items, fresh];
    const base = items.find((c) => c.isBase === 1) ?? null;
    set({ items, base });
  },

  setBase: async (code) => {
    await setBaseCurrency(code);
    const items = get().items.map((c) => ({ ...c, isBase: c.code === code ? 1 : 0 }));
    const base = items.find((c) => c.isBase === 1) ?? null;
    set({ items, base });
  },

  getByCode: (code) => get().items.find((c) => c.code === code),
}));
