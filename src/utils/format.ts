import { TransactionType } from '../types';

// Maps i18next language codes to BCP-47 locale tags for number/date formatting.
const LANG_TO_LOCALE: Record<string, string> = {
  hu: 'hu-HU',
  de: 'de-DE',
  fr: 'fr-FR',
  en: 'en-US',
};

// Currencies that conventionally display without decimal places.
const ZERO_DECIMAL_CURRENCIES = new Set(['HUF', 'JPY', 'KRW', 'VND', 'IDR', 'ISK', 'TWD']);

let _currentLocale = 'en-US';

export const setFormatLocale = (lang: string): void => {
  _currentLocale = LANG_TO_LOCALE[lang] ?? 'en-US';
};

export const getFormatLocale = (): string => _currentLocale;

export const formatCurrency = (amount: number, currency = 'HUF'): string => {
  try {
    const decimals = ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2;
    return new Intl.NumberFormat(_currentLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const POSITIVE_TYPES: TransactionType[] = ['INCOME', 'LOAN_RECEIVED', 'INVESTMENT_SELL' /*, 'DIVIDEND', 'INTEREST' */];

export const formatSigned = (amount: string | number, type: TransactionType, currency = 'HUF'): string => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  const sign = POSITIVE_TYPES.includes(type) ? '+' : '-';
  return `${sign}${formatCurrency(Math.abs(n), currency)}`;
};
