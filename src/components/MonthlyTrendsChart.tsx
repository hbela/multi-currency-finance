import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

import { MonthlySeriesPoint } from '../db/transactions';
import { useAppTheme } from '../theme';
import { monthShortLabel } from '../utils/date';
import { formatCurrency } from '../utils/format';

interface Props {
  data: MonthlySeriesPoint[];
  currency?: string;
  height?: number;
}

const BAR_AREA_HEIGHT = 140;
const BAR_WIDTH = 12;

export const MonthlyTrendsChart: React.FC<Props> = ({
  data,
  currency = 'USD',
  height = BAR_AREA_HEIGHT,
}) => {
  const theme = useAppTheme();
  const max = data.reduce((m, p) => Math.max(m, p.income, p.expense), 0);
  const anyData = max > 0;

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Legend color={theme.colors.income} label="Income" />
        <Legend color={theme.colors.expense} label="Expense" />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          height,
          gap: 4,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.outlineVariant,
          paddingBottom: 2,
        }}>
        {data.map((point) => {
          const incomeH = anyData ? (point.income / max) * height : 0;
          const expenseH = anyData ? (point.expense / max) * height : 0;
          return (
            <View
              key={point.month}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: 3,
                  height,
                }}>
                <Bar height={incomeH} color={theme.colors.income} />
                <Bar height={expenseH} color={theme.colors.expense} />
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: 4 }}>
        {data.map((point) => (
          <View key={point.month} style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {monthShortLabel(point.month)}
            </Text>
          </View>
        ))}
      </View>

      {!anyData && (
        <Text
          variant="bodySmall"
          style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
          No data in this range yet.
        </Text>
      )}

      {anyData && (
        <Text
          variant="labelSmall"
          style={{ textAlign: 'right', color: theme.colors.onSurfaceVariant }}>
          Max: {formatCurrency(max, currency)}
        </Text>
      )}
    </View>
  );
};

const Bar: React.FC<{ height: number; color: string }> = ({ height, color }) => (
  <View
    style={{
      width: BAR_WIDTH,
      height: Math.max(height, height > 0 ? 2 : 0),
      backgroundColor: color,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    }}
  />
);

const Legend: React.FC<{ color: string; label: string }> = ({ color, label }) => {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
    </View>
  );
};
