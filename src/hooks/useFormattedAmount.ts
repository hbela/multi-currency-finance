import { useMemo } from 'react';
import { useLocaleStore } from '../store/localeStore';
import { formatMoney } from '../utils/format';

/**
 * Returns a locale-aware formatted currency string.
 * Re-computes only when amount, locale, or currency changes.
 * React Query cache stays untouched — only presentation updates.
 */
export const useFormattedAmount = (amount: number, currency?: string): string => {
  const { lang, currency: storeCurrency } = useLocaleStore();
  const resolved = currency ?? storeCurrency;
  return useMemo(() => formatMoney(amount, lang, resolved), [amount, lang, resolved]);
};

/**
 * Returns the formatMoney function bound to the current locale.
 * Useful when you need to format multiple amounts in one component.
 */
export const useMoneyFormatter = (currency?: string) => {
  const { lang, currency: storeCurrency } = useLocaleStore();
  const resolved = currency ?? storeCurrency;
  return useMemo(
    () => (amount: number) => formatMoney(amount, lang, resolved),
    [lang, resolved],
  );
};
