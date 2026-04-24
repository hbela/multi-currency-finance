export type AccountType = 'cash' | 'bank' | 'card' | 'crypto' | 'loan' | 'investment';

export type TransactionType =
  | 'EXPENSE'
  | 'INCOME'
  | 'TRANSFER'
  | 'INVESTMENT_BUY'
  | 'INVESTMENT_SELL'
  | 'LOAN_RECEIVED'
  | 'LOAN_REPAYMENT';
  // | 'DIVIDEND'          // disabled — not needed for digital-nomad use case
  // | 'INTEREST'          // disabled — not needed for digital-nomad use case
  // | 'CREDIT_CARD_PAYMENT'; // disabled — not needed for digital-nomad use case

/** @deprecated Use TransactionType instead */
export type TxnType = 'income' | 'expense' | 'transfer' | 'investment' | 'debt' | 'subscription';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type TransactionStatus = 'pending' | 'cleared' | 'reconciled';

export interface RecurringRule {
  frequency: RecurringFrequency;
  interval: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  endDate?: string;
  lastGeneratedDate?: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: string;
  isActive: number;
  icon: string | null;
  color: string | null;
  notes: string | null;
  created_at: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  type: TransactionType;
  isDefault: number;
  parentId: string | null;
  created_at: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: number;
  amount: string;
  currency: string;
  amountBase: string;
  baseCurrency: string;
  exchangeRate: string;
  accountId: string | null;
  categoryId: string | null;
  relatedTransactionId: string | null;
  description: string | null;
  source: string | null;
  tags: string | null;
  notes: string | null;
  details: string | null;
  isRecurring: number;
  recurringRule: string | null;
  recurringParentId: string | null;
  status: TransactionStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Budget {
  id: string;
  category_id: string;
  amount: number;
  month: string;
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

export interface MonthlySummary {
  income: number;
  expense: number;
  net: number;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface InvestmentHolding {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currency: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  dateFrom?: number;
  dateTo?: number;
  search?: string;
}
