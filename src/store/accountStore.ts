import { create } from 'zustand';
import { Account, AccountType } from '../types';
import * as dao from '../db/accounts';

interface AccountStore {
  items: Account[];
  loading: boolean;
  load: () => Promise<void>;
  add: (input: { name: string; type: AccountType; currency: string }) => Promise<Account>;
  update: (row: Account) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  items: [],
  loading: false,
  load: async () => {
    set({ loading: true });
    const items = await dao.listAccounts();
    set({ items, loading: false });
  },
  add: async (input) => {
    const row = await dao.createAccount(input);
    set({ items: [...get().items, row] });
    return row;
  },
  update: async (row) => {
    await dao.updateAccount(row);
    set({ items: get().items.map((a) => (a.id === row.id ? row : a)) });
  },
  remove: async (id) => {
    await dao.deleteAccount(id);
    set({ items: get().items.filter((a) => a.id !== id) });
  },
}));
