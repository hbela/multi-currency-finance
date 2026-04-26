import React from 'react';
import { View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMoneyFormatter } from '../hooks/useFormattedAmount';
import { useAppTheme } from '../theme';

interface Props {
  balance: number;
  income: number;
  expense: number;
  currency?: string;
}

export const SummaryCard: React.FC<Props> = ({ balance, income, expense, currency = 'USD' }) => {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const fmt = useMoneyFormatter(currency);
  return (
    <Card mode="elevated" style={{ margin: 16 }}>
      <Card.Content style={{ gap: 12 }}>
        <View>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('dashboard.totalBalance')}
          </Text>
          <Text variant="headlineMedium">{fmt(balance)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('dashboard.incomeThisMonth')}
            </Text>
            <Text variant="titleMedium" style={{ color: theme.colors.income }}>
              {fmt(income)}
            </Text>
          </View>
          <View>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('dashboard.expenseThisMonth')}
            </Text>
            <Text variant="titleMedium" style={{ color: theme.colors.expense }}>
              {fmt(expense)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};
