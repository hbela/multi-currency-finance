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
  institution: string | null;
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
  // v7 fields
  fromAccountId: string | null;
  toAccountId: string | null;
  receivedAmount: string | null;
  country: string | null;
  city: string | null;
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

// ── v7: new entities ──────────────────────────────────────────────────────────

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  isBase: number;
  isActive: number;
  created_at: number;
}

export interface ExchangeRate {
  id: string;
  fromCode: string;
  toCode: string;
  rate: string;
  source: 'manual' | 'api';
  date: number;
  created_at: number;
}

export type AssetClass = 'stock' | 'etf' | 'crypto' | 'bond' | 'other';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  currency: string;
  exchange: string | null;
  created_at: number;
}

export interface Holding {
  id: string;
  assetId: string;
  accountId: string;
  quantity: string;
  avgCostBasis: string;
  created_at: number;
  updated_at: number;
}

export interface HoldingWithAsset extends Holding {
  asset: Asset;
  currentValue?: string;
  unrealizedPnL?: string;
}

export type LoanType = 'mortgage' | 'personal' | 'auto' | 'student';

export interface Loan {
  id: string;
  accountId: string;
  name: string;
  principalAmount: string;
  currency: string;
  interestRate: string;
  startDate: number;
  termMonths: number;
  loanType: LoanType;
  lender: string | null;
  notes: string | null;
  isActive: number;
  created_at: number;
  updated_at: number;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  transactionId: string | null;
  paymentDate: number;
  principalPaid: string;
  interestPaid: string;
  totalPaid: string;
  remainingBalance: string;
  created_at: number;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  accountId: string;
  amount: string;
  currency: string;
  amountBase: string;
  baseCurrency: string;
  exchangeRate: string;
  entryType: 'debit' | 'credit';
  created_at: number;
}
