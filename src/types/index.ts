export type AccountType = 'cash' | 'bank' | 'card';
export type TxnType = 'income' | 'expense' | 'transfer' | 'investment' | 'debt' | 'subscription';
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
  // Financial accuracy (all types)
  currency: string | null;
  exchange_rate: number | null;
  original_amount: number | null;
  original_currency: string | null;
  // Expense
  merchant: string | null;
  is_reimbursable: 0 | 1 | null;
  // Income
  source: string | null;
  payer: string | null;
  is_taxable: 0 | 1 | null;
  // Transfer
  counterparty: string | null;
  reference: string | null;
  fee: number | null;
  // Investment
  security_name: string | null;
  symbol: string | null;
  quantity: number | null;
  price: number | null;
  order_type: string | null;
  // Debt
  creditor: string | null;
  debt_type: string | null;
  interest_rate: number | null;
  remaining_term: number | null;
  // Subscription
  provider: string | null;
  plan: string | null;
  next_billing_date: number | null;
  is_auto_renew: 0 | 1 | null;
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
