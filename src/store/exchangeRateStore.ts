import { create } from 'zustand';
import { ExchangeRate } from '../types';
import { listRates, upsertRate, deleteRate } from '../db/exchangeRates';

interface ExchangeRateStore {
  items: ExchangeRate[];
  loading: boolean;
  load: () => Promise<void>;
  upsertRate: (input: Omit<ExchangeRate, 'id' | 'created_at'>) => Promise<ExchangeRate>;
  deleteRate: (id: string) => Promise<void>;
  getRate: (fromCode: string, toCode: string) => ExchangeRate | undefined;
}

export const useExchangeRateStore = create<ExchangeRateStore>((set, get) => ({
  items: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    try {
      const items = await listRates();
      set({ items, loading: false });
    } catch (e) {
      set({ loading: false });
      console.error('[exchangeRateStore] load failed:', e);
    }
  },

  upsertRate: async (input) => {
    const saved = await upsertRate(input);
    // Refresh from DB to get deduplicated state
    const items = await listRates();
    set({ items });
    return saved;
  },

  deleteRate: async (id) => {
    await deleteRate(id);
    set({ items: get().items.filter((r) => r.id !== id) });
  },

  getRate: (fromCode, toCode) =>
    get().items.find(
      (r) => r.fromCode === fromCode && r.toCode === toCode
    ),
}));
