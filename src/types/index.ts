export type AccountType = 'cash' | 'bank' | 'card';
export type TxnType = 'income' | 'expense';
export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  created_at: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  type: TxnType;
  created_at: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TxnType;
  date: number;
  note: string | null;
  account_id: string | null;
  category_id: string | null;
  receipt_image: string | null;
  created_at: number;
}

export interface Budget {
  id: string;
  category_id: string;
  amount: number;
  month: string;
  created_at: number;
}

export interface RecurringTransaction {
  id: string;
  amount: number;
  type: TxnType;
  category_id: string | null;
  account_id: string | null;
  note: string | null;
  frequency: RecurringFrequency;
  start_date: number;
  next_due_date: number;
  end_date: number | null;
  last_run_date: number | null;
  active: number;
  created_at: number;
}

export interface MonthlyTotals {
  income: number;
  expense: number;
}

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percent: number;
}
