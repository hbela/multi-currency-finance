import React from 'react';
import { View } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { BudgetProgress } from '../types';
import { useMoneyFormatter } from '../hooks/useFormattedAmount';
import { useCategoryStore } from '../store/categoryStore';
import { useAppTheme } from '../theme';

interface Props {
  progress: BudgetProgress;
  currency?: string;
}

export const BudgetProgressBar: React.FC<Props> = ({ progress, currency = 'USD' }) => {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const fmt = useMoneyFormatter(currency);
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
          {fmt(progress.spent)} / {fmt(progress.budget.amount)}
        </Text>
      </View>
      <ProgressBar progress={pct} color={color} />
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {over
          ? t('budgets.overBy', { amount: fmt(-progress.remaining) })
          : t('budgets.left', { amount: fmt(progress.remaining) })}
      </Text>
    </View>
  );
};
