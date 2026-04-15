export const formatCurrency = (amount: number, currency = 'USD'): string => {
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

export const formatSigned = (amount: number, type: 'income' | 'expense', currency = 'USD'): string => {
  const sign = type === 'expense' ? '-' : '+';
  return `${sign}${formatCurrency(Math.abs(amount), currency)}`;
};
