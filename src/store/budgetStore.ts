import { create } from 'zustand';
import { Budget } from '../types';
import * as dao from '../db/budgets';

interface BudgetStore {
  items: Budget[];
  loading: boolean;
  load: () => Promise<void>;
  add: (input: { category_id: string; amount: number; month: string }) => Promise<Budget>;
  update: (row: Budget) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  items: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    const items = await dao.listBudgets();
    set({ items, loading: false });
  },
  add: async (input) => {
    const row = await dao.createBudget(input);
    const without = get().items.filter(
      (b) => !(b.category_id === row.category_id && b.month === row.month)
    );
    set({ items: [...without, row] });
    return row;
  },
  update: async (row) => {
    await dao.updateBudget(row);
    set({ items: get().items.map((b) => (b.id === row.id ? row : b)) });
  },
  remove: async (id) => {
    await dao.deleteBudget(id);
    set({ items: get().items.filter((b) => b.id !== id) });
  },
}));
