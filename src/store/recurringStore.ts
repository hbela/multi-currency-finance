import { create } from 'zustand';
import { RecurringTransaction } from '../types';
import * as dao from '../db/recurring';

interface RecurringStore {
  items: RecurringTransaction[];
  loading: boolean;
  load: () => Promise<void>;
  add: (input: dao.RecurringInput) => Promise<RecurringTransaction>;
  update: (row: RecurringTransaction) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setActive: (id: string, active: boolean) => Promise<void>;
}

export const useRecurringStore = create<RecurringStore>((set, get) => ({
  items: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    const items = await dao.listRecurring();
    set({ items, loading: false });
  },
  add: async (input) => {
    const row = await dao.createRecurring(input);
    await get().load();
    return row;
  },
  update: async (row) => {
    await dao.updateRecurring(row);
    await get().load();
  },
  remove: async (id) => {
    await dao.deleteRecurring(id);
    set({ items: get().items.filter((r) => r.id !== id) });
  },
  setActive: async (id, active) => {
    await dao.setRecurringActive(id, active);
    set({
      items: get().items.map((r) => (r.id === id ? { ...r, active: active ? 1 : 0 } : r)),
    });
  },
}));
