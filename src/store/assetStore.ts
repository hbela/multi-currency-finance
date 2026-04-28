import { create } from 'zustand';
import { Asset, AssetClass } from '../types';
import { listAssets, createAsset, updateAsset, deleteAsset, CreateAssetInput } from '../db/assets';

interface AssetStore {
  items: Asset[];
  loading: boolean;
  load: () => Promise<void>;
  add: (input: CreateAssetInput) => Promise<Asset>;
  update: (id: string, input: Partial<CreateAssetInput>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getById: (id: string) => Asset | undefined;
  getByClass: (assetClass: AssetClass) => Asset[];
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  items: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    try {
      const items = await listAssets();
      set({ items, loading: false });
    } catch (e) {
      set({ loading: false });
      console.error('[assetStore] load failed:', e);
    }
  },

  add: async (input) => {
    const asset = await createAsset(input);
    set({ items: [...get().items, asset] });
    return asset;
  },

  update: async (id, input) => {
    await updateAsset(id, input);
    const items = await listAssets();
    set({ items });
  },

  remove: async (id) => {
    await deleteAsset(id);
    set({ items: get().items.filter((a) => a.id !== id) });
  },

  getById: (id) => get().items.find((a) => a.id === id),

  getByClass: (assetClass) => get().items.filter((a) => a.assetClass === assetClass),
}));
