import { TransactionType } from '../types';

export const formatCurrency = (amount: number, currency = 'HUF'): string => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const POSITIVE_TYPES: TransactionType[] = ['INCOME', 'LOAN_RECEIVED', 'INVESTMENT_SELL', 'DIVIDEND', 'INTEREST'];

export const formatSigned = (amount: string | number, type: TransactionType, currency = 'HUF'): string => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  const sign = POSITIVE_TYPES.includes(type) ? '+' : '-';
  return `${sign}${formatCurrency(Math.abs(n), currency)}`;
};
