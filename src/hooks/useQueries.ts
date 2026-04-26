import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listAccounts } from '@/src/db/accounts';
import { listCategories } from '@/src/db/categories';
import { listBudgets, getBudgetProgressForMonth } from '@/src/db/budgets';
import {
  listTransactions,
  listRecentTransactions,
  listTransactionsByMonth,
  getFilteredTransactions,
  createTransactionWithBalanceUpdate,
  updateTransaction,
  deleteTransaction,
  getMonthlySummary,
  type CreateTransactionInput,
} from '@/src/db/transactions';
import { Transaction, TransactionFilters } from '@/src/types';
import { useAccountStore } from '@/src/store/accountStore';
import { useTransactionStore } from '@/src/store/transactionStore';
import { useBudgetStore } from '@/src/store/budgetStore';

// ─── Query keys ──────────────────────────────────────────────────────────────

export const qk = {
  accounts: () => ['accounts'] as const,
  categories: () => ['categories'] as const,
  budgets: () => ['budgets'] as const,
  budgetProgress: (month: string) => ['budgets', 'progress', month] as const,
  transactions: () => ['transactions'] as const,
  transactionsRecent: (limit?: number) => ['transactions', 'recent', limit ?? 10] as const,
  transactionsByMonth: (month: string) => ['transactions', 'month', month] as const,
  transactionsFiltered: (filters: TransactionFilters) => ['transactions', 'filtered', filters] as const,
  monthlySummary: (year: number, month: number) => ['transactions', 'summary', year, month] as const,
};

// ─── Account queries ──────────────────────────────────────────────────────────

export const useAccounts = () =>
  useQuery({ queryKey: qk.accounts(), queryFn: listAccounts });

// ─── Category queries ─────────────────────────────────────────────────────────

export const useCategories = () =>
  useQuery({ queryKey: qk.categories(), queryFn: listCategories });

// ─── Budget queries ───────────────────────────────────────────────────────────

export const useBudgets = () =>
  useQuery({ queryKey: qk.budgets(), queryFn: listBudgets });

export const useBudgetProgress = (month: string) =>
  useQuery({
    queryKey: qk.budgetProgress(month),
    queryFn: () => getBudgetProgressForMonth(month),
  });

// ─── Transaction queries ──────────────────────────────────────────────────────

export const useTransactions = () =>
  useQuery({ queryKey: qk.transactions(), queryFn: listTransactions });

export const useRecentTransactions = (limit?: number) =>
  useQuery({
    queryKey: qk.transactionsRecent(limit),
    queryFn: () => listRecentTransactions(limit),
  });

export const useTransactionsByMonth = (month: string) =>
  useQuery({
    queryKey: qk.transactionsByMonth(month),
    queryFn: () => listTransactionsByMonth(month),
  });

export const useFilteredTransactions = (filters: TransactionFilters) =>
  useQuery({
    queryKey: qk.transactionsFiltered(filters),
    queryFn: () => getFilteredTransactions(filters),
  });

export const useMonthlySummary = (year: number, month: number) =>
  useQuery({
    queryKey: qk.monthlySummary(year, month),
    queryFn: () => getMonthlySummary(year, month),
  });

// ─── Transaction mutations ────────────────────────────────────────────────────

export const useCreateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      createTransactionWithBalanceUpdate(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.transactions() });
      qc.invalidateQueries({ queryKey: qk.accounts() });
      // keep Zustand stores in sync
      useTransactionStore.getState().load();
      useAccountStore.getState().load();
    },
  });
};

export const useUpdateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (row: Transaction) => updateTransaction(row),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.transactions() });
      useTransactionStore.getState().load();
    },
  });
};

export const useDeleteTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.transactions() });
      qc.invalidateQueries({ queryKey: qk.accounts() });
      useTransactionStore.getState().load();
      useAccountStore.getState().load();
      useBudgetStore.getState().load();
    },
  });
};
