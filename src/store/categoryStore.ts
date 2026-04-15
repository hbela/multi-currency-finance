import { create } from 'zustand';
import { Category, TxnType } from '../types';
import * as dao from '../db/categories';

interface CategoryStore {
  items: Category[];
  loading: boolean;
  load: () => Promise<void>;
  add: (input: { name: string; icon: string | null; type: TxnType }) => Promise<Category>;
  update: (row: Category) => Promise<void>;
  remove: (id: string) => Promise<void>;
  byId: (id: string | null) => Category | undefined;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  items: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    const items = await dao.listCategories();
    set({ items, loading: false });
  },
  add: async (input) => {
    const row = await dao.createCategory(input);
    set({ items: [...get().items, row] });
    return row;
  },
  update: async (row) => {
    await dao.updateCategory(row);
    set({ items: get().items.map((c) => (c.id === row.id ? row : c)) });
  },
  remove: async (id) => {
    await dao.deleteCategory(id);
    set({ items: get().items.filter((c) => c.id !== id) });
  },
  byId: (id) => (id ? get().items.find((c) => c.id === id) : undefined),
}));
