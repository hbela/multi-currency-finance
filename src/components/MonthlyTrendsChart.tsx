import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { MonthlySeriesPoint } from '../db/transactions';
import { useAppTheme } from '../theme';
import { monthShortLabel } from '../utils/date';
import { useLocaleStore } from '../store/localeStore';
import { useMoneyFormatter } from '../hooks/useFormattedAmount';

interface Props {
  data: MonthlySeriesPoint[];
  currency?: string;
  height?: number;
}

const BAR_AREA_HEIGHT = 180;
const BAR_MIN_PX = 3;

export const MonthlyTrendsChart: React.FC<Props> = ({
  data,
  currency = 'USD',
  height = BAR_AREA_HEIGHT,
}) => {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const { locale } = useLocaleStore();
  const fmt = useMoneyFormatter(currency);
  const max = data.reduce((m, p) => Math.max(m, p.income, p.expense), 0);
  const anyData = max > 0;

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Legend color={theme.colors.income} label={t('reports.totalIncome')} />
        <Legend color={theme.colors.expense} label={t('reports.totalExpense')} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          height,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.outlineVariant,
          paddingBottom: 2,
        }}>
        {data.map((point) => {
          const incomeH = anyData ? Math.max((point.income / max) * height, point.income > 0 ? BAR_MIN_PX : 0) : 0;
          const expenseH = anyData ? Math.max((point.expense / max) * height, point.expense > 0 ? BAR_MIN_PX : 0) : 0;
          return (
            <View
              key={point.month}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                <Bar height={incomeH} color={theme.colors.income} />
                <Bar height={expenseH} color={theme.colors.expense} />
              </View>
            </View>
          );
        })}
      </View>

      {/* Month labels — always show all */}
      <View style={{ flexDirection: 'row' }}>
        {data.map((point) => (
          <View key={point.month} style={{ flex: 1, alignItems: 'center' }}>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}
              numberOfLines={1}>
              {monthShortLabel(point.month, locale)}
            </Text>
          </View>
        ))}
      </View>

      {!anyData && (
        <Text
          variant="bodySmall"
          style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
          {t('reports.noTransactions', { type: '' }).replace(/\.$/, '…')}
        </Text>
      )}

      {anyData && (
        <Text
          variant="labelSmall"
          style={{ textAlign: 'right', color: theme.colors.onSurfaceVariant }}>
          Max: {fmt(max)}
        </Text>
      )}
    </View>
  );
};

const Bar: React.FC<{ height: number; color: string }> = ({ height, color }) => (
  <View
    style={{
      width: 10,
      height,
      backgroundColor: color,
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
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
