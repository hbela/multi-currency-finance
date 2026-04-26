import i18n from 'i18next';
import { TransactionType } from '../types';

const ZERO_DECIMAL_CURRENCIES = new Set(['HUF', 'JPY', 'KRW', 'VND', 'IDR', 'ISK', 'TWD']);

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  HUF: 'Ft',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  JPY: '¥',
};

const EN_NATIVE_SYMBOL_CURRENCIES = new Set(['GBP', 'EUR', 'USD']);

export const decimalsFor = (currency: string): number =>
  ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2;

export const getDecimalSeparator = (lang: string): string =>
  lang === 'en' ? '.' : ',';

export const getThousandSeparator = (lang: string): string => {
  if (lang === 'en') return ',';
  if (lang === 'de') return '.';
  return ' '; // hu, fr
};

export const parseLocaleNumber = (text: string, lang: string): number => {
  const thousandSep = getThousandSeparator(lang);
  const decimalSep = getDecimalSeparator(lang);
  const escapedThousand =
    thousandSep === '.' ? '\\.' : thousandSep === ' ' ? '\\s' : thousandSep;
  const stripped = text
    .replace(new RegExp(escapedThousand, 'g'), '')
    .replace(decimalSep, '.');
  return parseFloat(stripped);
};

export const getInputFormat = (lang: string): { delimiter: string; separator: string } => ({
  delimiter: getThousandSeparator(lang),
  separator: getDecimalSeparator(lang),
});

const splitFixed = (amount: number, decimals: number): { sign: string; intPart: string; fracPart: string } => {
  const fixed = Math.abs(amount).toFixed(decimals);
  const [intPart, fracPart = ''] = fixed.split('.');
  return { sign: amount < 0 ? '-' : '', intPart, fracPart };
};

const groupDigits = (intPart: string, sep: string): string =>
  intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);

const symbolFor = (currency: string): string => {
  const upper = currency.toUpperCase();
  return CURRENCY_SYMBOLS[upper] ?? upper;
};

// English (en-GB / en-US): 1,234.56 — comma thousand, point decimal, symbol before
const formatEN = (amount: number, currency: string): string => {
  const upper = currency.toUpperCase();
  const decimals = decimalsFor(upper);
  const { sign, intPart, fracPart } = splitFixed(amount, decimals);
  const grouped = groupDigits(intPart, ',');
  const number = decimals > 0 ? `${grouped}.${fracPart}` : grouped;
  const symbol = EN_NATIVE_SYMBOL_CURRENCIES.has(upper) ? symbolFor(upper) : upper;
  return `${sign}${symbol} ${number}`;
};

// German (de-DE): 1.234,56 — point thousand, comma decimal, symbol after
const formatDE = (amount: number, currency: string): string => {
  const upper = currency.toUpperCase();
  const decimals = decimalsFor(upper);
  const { sign, intPart, fracPart } = splitFixed(amount, decimals);
  const grouped = groupDigits(intPart, '.');
  const number = decimals > 0 ? `${grouped},${fracPart}` : grouped;
  return `${sign}${number} ${symbolFor(upper)}`;
};

// Hungarian (hu-HU): 1 234,56 — space thousand, comma decimal, symbol after
const formatHU = (amount: number, currency: string): string => {
  const upper = currency.toUpperCase();
  const decimals = decimalsFor(upper);
  const { sign, intPart, fracPart } = splitFixed(amount, decimals);
  const grouped = groupDigits(intPart, ' ');
  const number = decimals > 0 ? `${grouped},${fracPart}` : grouped;
  return `${sign}${number} ${symbolFor(upper)}`;
};

// French (fr-FR): 1 234,56 — NBSP thousand, comma decimal, symbol after
const formatFR = (amount: number, currency: string): string => {
  const upper = currency.toUpperCase();
  const decimals = decimalsFor(upper);
  const { sign, intPart, fracPart } = splitFixed(amount, decimals);
  const grouped = groupDigits(intPart, ' ');
  const number = decimals > 0 ? `${grouped},${fracPart}` : grouped;
  return `${sign}${number} ${symbolFor(upper)}`;
};

const FORMATTERS: Record<string, (amount: number, currency: string) => string> = {
  en: formatEN,
  hu: formatHU,
  de: formatDE,
  fr: formatFR,
};

const LANG_TO_LOCALE: Record<string, string> = {
  en: 'en-GB', hu: 'hu-HU', de: 'de-DE', fr: 'fr-FR',
};

// i18n.language can be 'hu' or 'hu-HU' depending on how it was set — normalize to the 2-letter code.
const currentLang = (): string => {
  const raw = i18n.language ?? 'en';
  return raw.split('-')[0].toLowerCase();
};

export const setFormatLocale = (_lang: string): void => {};
export const getFormatLocale = (): string => LANG_TO_LOCALE[currentLang()] ?? 'en-GB';

export const formatCurrency = (amount: number, currency = 'HUF', tag = '?'): string => {
  const lang = currentLang();
  const formatter = FORMATTERS[lang] ?? formatEN;
  const out = formatter(amount, currency);
  if (__DEV__) console.log(`[fmt:${tag}]`, JSON.stringify({ lang, amount, out }));
  return out;
};

/** Pure formatting function — accepts explicit lang/currency so it works outside React. */
export const formatMoney = (amount: number, lang: string, currency: string): string => {
  const key = lang.split('-')[0].toLowerCase();
  const formatter = FORMATTERS[key] ?? formatEN;
  return formatter(amount, currency);
};

const POSITIVE_TYPES: TransactionType[] = ['INCOME', 'LOAN_RECEIVED', 'INVESTMENT_SELL'];

export const formatSigned = (amount: string | number, type: TransactionType, currency = 'HUF'): string => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  const sign = POSITIVE_TYPES.includes(type) ? '+' : '-';
  return `${sign}${formatCurrency(Math.abs(n), currency)}`;
};
