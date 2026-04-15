import React from 'react';
import { View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { formatCurrency } from '../utils/format';
import { useAppTheme } from '../theme';

interface Props {
  balance: number;
  income: number;
  expense: number;
  currency?: string;
}

export const SummaryCard: React.FC<Props> = ({ balance, income, expense, currency = 'USD' }) => {
  const theme = useAppTheme();
  return (
    <Card mode="elevated" style={{ margin: 16 }}>
      <Card.Content style={{ gap: 12 }}>
        <View>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Total balance
          </Text>
          <Text variant="headlineMedium">{formatCurrency(balance, currency)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Income (this month)
            </Text>
            <Text variant="titleMedium" style={{ color: theme.colors.income }}>
              {formatCurrency(income, currency)}
            </Text>
          </View>
          <View>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Expense (this month)
            </Text>
            <Text variant="titleMedium" style={{ color: theme.colors.expense }}>
              {formatCurrency(expense, currency)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};
