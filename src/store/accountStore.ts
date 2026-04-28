import { create } from 'zustand';
import { Account, AccountType } from '../types';
import * as dao from '../db/accounts';

interface AccountStore {
  items: Account[];
  loading: boolean;
  load: () => Promise<void>;
  add: (input: { name: string; type: AccountType; currency: string; institution?: string | null; icon?: string | null; color?: string | null; notes?: string | null }) => Promise<Account>;
  update: (row: Account) => Promise<void>;
  remove: (id: string) => Promise<void>;
  deactivate: (id: string) => Promise<void>;
  getNetWorth: () => number;
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
  deactivate: async (id) => {
    await dao.deactivateAccount(id);
    set({ items: get().items.filter((a) => a.id !== id) });
  },
  getNetWorth: () => {
    return get().items.reduce((sum, a) => sum + parseFloat(a.balance || '0'), 0);
  },
}));
