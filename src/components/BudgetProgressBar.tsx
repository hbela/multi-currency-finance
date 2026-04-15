import React from 'react';
import { View } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { BudgetProgress } from '../types';
import { formatCurrency } from '../utils/format';
import { useCategoryStore } from '../store/categoryStore';
import { useAppTheme } from '../theme';

interface Props {
  progress: BudgetProgress;
  currency?: string;
}

export const BudgetProgressBar: React.FC<Props> = ({ progress, currency = 'USD' }) => {
  const theme = useAppTheme();
  const category = useCategoryStore((s) => s.byId(progress.budget.category_id));
  const pct = Math.min(progress.percent, 1);
  const over = progress.percent > 1;
  const color = over
    ? theme.colors.expense
    : progress.percent > 0.8
      ? theme.colors.warning
      : theme.colors.income;
  return (
    <View style={{ paddingVertical: 12, paddingHorizontal: 16, gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="titleMedium">{category?.name ?? 'Unknown'}</Text>
        <Text variant="titleMedium" style={{ color }}>
          {formatCurrency(progress.spent, currency)} / {formatCurrency(progress.budget.amount, currency)}
        </Text>
      </View>
      <ProgressBar progress={pct} color={color} />
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {over
          ? `Over by ${formatCurrency(-progress.remaining, currency)}`
          : `${formatCurrency(progress.remaining, currency)} left`}
      </Text>
    </View>
  );
};
