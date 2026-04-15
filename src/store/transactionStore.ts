import { create } from 'zustand';
import { Transaction, TxnType } from '../types';
import * as dao from '../db/transactions';

interface TransactionStore {
  items: Transaction[];
  loading: boolean;
  load: () => Promise<void>;
  add: (input: {
    amount: number;
    type: TxnType;
    date: number;
    note: string | null;
    account_id: string | null;
    category_id: string | null;
    receipt_image: string | null;
  }) => Promise<Transaction>;
  update: (row: Transaction) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  items: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    const items = await dao.listTransactions();
    set({ items, loading: false });
  },
  add: async (input) => {
    const row = await dao.createTransaction(input);
    set({ items: [row, ...get().items] });
    return row;
  },
  update: async (row) => {
    await dao.updateTransaction(row);
    set({
      items: get()
        .items.map((t) => (t.id === row.id ? row : t))
        .sort((a, b) => b.date - a.date || b.created_at - a.created_at),
    });
  },
  remove: async (id) => {
    await dao.deleteTransaction(id);
    set({ items: get().items.filter((t) => t.id !== id) });
  },
}));
