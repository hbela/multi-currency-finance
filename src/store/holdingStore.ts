import { create } from 'zustand';
import { HoldingWithAsset } from '../types';
import {
  listHoldingsWithAsset,
  createHolding,
  updateHolding,
  deleteHolding,
  CreateHoldingInput,
} from '../db/holdings';

interface HoldingStore {
  items: HoldingWithAsset[];
  loading: boolean;
  load: () => Promise<void>;
  add: (input: CreateHoldingInput) => Promise<void>;
  update: (id: string, input: Partial<CreateHoldingInput>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getByAsset: (assetId: string) => HoldingWithAsset[];
  getByAccount: (accountId: string) => HoldingWithAsset[];
}

export const useHoldingStore = create<HoldingStore>((set, get) => ({
  items: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    try {
      const items = await listHoldingsWithAsset();
      set({ items, loading: false });
    } catch (e) {
      set({ loading: false });
      console.error('[holdingStore] load failed:', e);
    }
  },

  add: async (input) => {
    await createHolding(input);
    const items = await listHoldingsWithAsset();
    set({ items });
  },

  update: async (id, input) => {
    await updateHolding(id, input);
    const items = await listHoldingsWithAsset();
    set({ items });
  },

  remove: async (id) => {
    await deleteHolding(id);
    set({ items: get().items.filter((h) => h.id !== id) });
  },

  getByAsset: (assetId) => get().items.filter((h) => h.assetId === assetId),

  getByAccount: (accountId) => get().items.filter((h) => h.accountId === accountId),
}));
